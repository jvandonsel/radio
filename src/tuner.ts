/**
 * Tuning process.
 * Monitors the tuning knob position by reading A/D values and tunes in the appropriate
 * station, or plays static if we're between stations.
 */

import { AdcConverter } from "./adc";
import { sleep } from "./utils";
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { getUrls } from "./urls";
import { poll_band_selector as pollBandSelector, Band } from "./band-selector";
import { set_power_led, set_tuning_led } from "./leds";

export class Tuner {

    // A/D values from the left to the right side of the tuning dial.
    // Determined empirically by measuring the ADC value at both ends.
    MIN_ADC_VALUE = 470;
    MAX_ADC_VALUE = 790;

    // Volumes 
    RADIO_VOLUME = 0.05;
    STATIC_VOLUME = 0.1;

    // VLC arguments
    VLC_OPTIONS = [];

    // Sound file with static noise
    STATIC_FILE = "./lib/static.wav";

    // Sliding window filter 
    FILTER_WINDOW_SIZE = 25;
    adc_window: number[] = [];
    adc_window_sum = 0;
    
    // A/D Converter
    adc: AdcConverter = new AdcConverter();

    // A list of ADC values corresponding to radio stations
    adc_stations: number[] = [];

    // Map of ADC values to radio station URL
    adc_to_url: Record<number, string> = {};

    // The current state of the band selector switch
    current_band: Band = Band.OFF;

    // Keeping separate radio and static processes active seems to make the transition between
    // static and radio faster than having a single process that switches between the static file
    // and the radio URL.
    radio_process: ChildProcessWithoutNullStreams | undefined = undefined;
    static_process: ChildProcessWithoutNullStreams | undefined = undefined;

    is_radio_playing = false;
    is_static_playing = false;

    /**
     * Given a band, populates the 'adc_stations' and 'adc_to_url' data structures
     * @param band 
     */
    populateBand(band: Band) : void {

        console.log(`Populating band ${band}`);

        // Get the list of URLs for the given band
        const urls = getUrls(band);
        const num_urls = urls.length;

        // Space our URLs across the dial evenly.
        // Making sure that both edges have a station.
        const url_step = Math.floor((this.MAX_ADC_VALUE - this.MIN_ADC_VALUE) / (num_urls - 1));

        this.adc_stations = [];
        this.adc_to_url = {};
        for (let i = 0; i < num_urls; ++i) {
            const center = url_step * i + this.MIN_ADC_VALUE;
            console.log(`Mapping center ${center} to ${urls[i]}`);
            this.adc_stations.push(center);
            this.adc_to_url[center] = urls[i];
        }
    }

    /**
     * Init the sliding window filter with the given value.
     * @param Value to fill the window with.
     */
    initFilter(value: number): void {
        this.adc_window.length = 0;
        for (let i = 0; i < this.FILTER_WINDOW_SIZE; ++i) {
            this.adc_window.push(value);
        }
        this.adc_window_sum = value * this.FILTER_WINDOW_SIZE;
    }

    /**
     * Play the given URL 
     * @param url URL to play
     */
    async playRadio(url: string): Promise<void> {
        if (this.is_radio_playing) return;

        if (!this.radio_process || this.radio_process.exitCode != null) {
            console.log(`Starting VLC with URL ${url}`);
            this.radio_process = spawn('vlc', [...this.VLC_OPTIONS, '--gain', `${this.RADIO_VOLUME}`, url], { stdio: ['pipe', 'pipe', 'pipe'] });
            this.radio_process.stdout.setEncoding('utf8');
        } else {
            // Already playing, change the URL
            console.log(`Changing URL to ${url}`);
            this.radio_process.stdio[0].write(`add ${url}\n`);
        }
        this.is_radio_playing = true;
    }

    /**
     * Play a static sound
     */
    playStatic(): void {
        if (this.is_static_playing) return;

        if (!this.static_process) {
            this.static_process = spawn('vlc', [...this.VLC_OPTIONS, '--loop','--gain', `${this.STATIC_VOLUME}`, this.STATIC_FILE], { stdio: ['pipe', 'pipe', 'pipe'] });
            this.static_process.stdout.setEncoding('utf8');
        } else {
            // Process already exists, unpause it
            console.log('Playing static');
            this.static_process.stdio[0].write('play\n');
        }
        this.is_static_playing = true;
    }

    /**
     * Pause static
     */
    pauseStatic(): void {
        if (!this.is_static_playing) return;

        if (this.static_process) {
            console.log('Pausing static');
            // 'pausing get_property pause' is guaranteed to pause if playing, and do nothing if paused.
            this.static_process.stdio[0].write('pause\n');
        }

        this.is_static_playing = false;
    }
    
    /**
     * Pause playback
     */
    pauseRadio(): void {
        if (!this.is_radio_playing) return;

        if (this.radio_process) {
            console.log('Pausing radio');
            // 'pausing get_property pause' is guaranteed to pause if playing, and do nothing if paused.
            this.radio_process.stdio[0].write('pause\n');
        }

        this.is_radio_playing = false;
    }
    
    /**
      * Stop static
     */
    stopStatic(): void {

        if (this.static_process) {
            // FIXME: this still leaves child processes around
            this.static_process.kill('SIGKILL');
            this.static_process = undefined;
        }

        this.is_static_playing = false;
    }
    /**
     * Stop playback
     */
    stopRadio(): void {

        if (this.radio_process) {
            // FIXME: this still leaves child processes around
            this.radio_process.kill('SIGKILL');
            this.radio_process = undefined;
        }

        this.is_radio_playing = false;
    }    

    /**
     * Read a raw value from the ADC, filter it, and return a filtered value.
     * @returns A filtered ADC value.
     */
    getFilteredAdcValue(): number {
        // Read a tuning value from the ADC
        const raw_value: number = this.adc.readAdc();

        // Add to sliding window filter and get the filtered value
        this.adc_window.push(raw_value);
        this.adc_window_sum += raw_value;
        // Remove oldest value
        this.adc_window_sum -= this.adc_window.shift() ?? 0;
        const filtered_value = Math.round(this.adc_window_sum / this.FILTER_WINDOW_SIZE);
        return filtered_value;
    }

    /**
     * Find the nearest center ADC value to the given ADC value.
     * @param adc_value 
     */
    findNearestCenter(adc_value: number): number {
        return this.adc_stations.reduce((a, b) => Math.abs(b - adc_value) < Math.abs(a - adc_value) ? b : a);
    }
    
    /**
     * Continuously monitor the tuning ADC and play the appropriate station.
     * Never returns.
     */
    public async tune() {
        
        // Whether we're locked on a station or not
        let is_locked = false;
        let locked_center = 0;

        // How close we need to be to a station center to lock onto it
        const PULL_IN_THRESHOLD = 3;
        // How far we need to wander from the center of a locked station to unlock from it
        const PULL_OFF_THRESHOLD = 7;

        // Seed the sliding window with the current raw ADC value
        const adc = this.adc.readAdc();
        this.initFilter(adc);

        /* eslint-disable no-constant-condition */
        while (true) {
            await sleep(50);

            // Check if our band selector has changed
            const band = pollBandSelector();
            if (band !== this.current_band) {
                console.log(`Switching band to ${band}`);
                this.current_band = band;
                if (band == Band.OFF) {
                    // Switching off
                    this.stopRadio();
                    this.stopStatic();
                } else {
                    // Switching to a different band
                    set_power_led(true);
                    set_tuning_led(false);
                    this.populateBand(band);
                    is_locked = false;
                    locked_center = 0;
                    this.pauseRadio();
                    this.playStatic();
                }
            }

            if (band === Band.OFF) {
                // Still off
                set_power_led(false);
                set_tuning_led(false);
                await sleep(500);
                continue;
            }

            try {
                // Get the tuning knob A/D value
                const filtered_adc_value = this.getFilteredAdcValue();

                if (is_locked) {
                    // Currently Locked on a station
                    if (Math.abs(filtered_adc_value - locked_center) > PULL_OFF_THRESHOLD) {
                        // Unlock
                        console.log(`Unlocking, filtered:${filtered_adc_value} last_locked:${locked_center}`);
                        is_locked = false;
                        set_tuning_led(false);
                        this.pauseRadio();
                        this.playStatic();
                    } else {
                        // Still locked. Keep playing radio.
                    }
                } else {
                    // Currently not locked on a station. Check if we should lock on a station.
                    // Find the nearest center ADC value and if it's close enough lock onto it.
                    const nearest_center = this.findNearestCenter(filtered_adc_value);
                    if (Math.abs(nearest_center - filtered_adc_value) <= PULL_IN_THRESHOLD) {
                        // Lock
                        const url = this.adc_to_url[nearest_center];
                        console.log(`Locking. center:${nearest_center} adc:${filtered_adc_value} ${url}`);
                        locked_center = nearest_center;
                        set_tuning_led(true);
                        is_locked = true;
                        this.pauseStatic();
                        this.playRadio(url);
                    } else {
                        // Still unlocked. Keep playing static.
                    }
                }
            } catch (e) {
                console.error(`Caught error reading ADC: ${e}\n`);
            }
        }
    }
}
