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

export class Tuner {

    // A/D values from the left to the right side of the tuning dial
    MIN_ADC_VALUE: number = 473;
    MAX_ADC_VALUE: number = 792;

    RADIO_VOLUME = 80;
    STATIC_VOLUME = 100;

    MPLAYER_OPTIONS = ["-loop", "0", "-ao", "pulse", "-slave", "-really-quiet"];

    // Static file
    // TODO: Move this file someplace else
    STATIC_FILE: string = "/static.wav";

    // Sliding window filter 
    FILTER_WINDOW_SIZE = 20;
    adc_window: number[] = [];
    adc_window_sum: number = 0;
    
    // A/D Converter
    adc: AdcConverter = new AdcConverter();

    // A list of ADC values corresponding to radio stations
    adc_stations: number[] = [];

    // Map of ADC values to radio station URL
    adc_to_url: Record<number, string> = {};

    current_band: Band = Band.OFF;

    // Keeping separate radio and static processes active seems to make the transition between
    // static/radio faster than having a single process that switches between the static file and the radio URL.
    radio_process: ChildProcessWithoutNullStreams | undefined = undefined;
    static_process: ChildProcessWithoutNullStreams | undefined = undefined;

    is_radio_playing: boolean = false;
    is_static_playing: boolean = false;

    /**
     * Given a selected band, populates the 'adc_stations' and 'adc_to_url' data structures
     * @param band 
     * @returns 
     */
    populateBand(band: Band) {

        console.log(`Populating band ${band}`);

        // Get the list of URLs for the given band
        const urls = getUrls(band);

        const num_urls = urls.length;
        console.log(`Found ${num_urls} URLs`);

        // Space our URLs across the dial evenly.
        // Making sure that both edges have a station.
        const url_step = Math.floor((this.MAX_ADC_VALUE - this.MIN_ADC_VALUE) / (num_urls - 1));
        console.log(`step size=${url_step} between ${this.MIN_ADC_VALUE} and ${this.MAX_ADC_VALUE}`);

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
    initFilter(value: number) {
        this.adc_window.length = 0;
        for (let i = 0; i < this.FILTER_WINDOW_SIZE; ++i) {
            this.adc_window.push(value);
        }
        this.adc_window_sum = value * this.FILTER_WINDOW_SIZE;
    }

    /**
     * Start playing the given URL 
     * @param url URL to play
     */
    async playRadio(url: string) {
        if (this.is_radio_playing) return;

        if (!this.radio_process) {
            this.radio_process = spawn('mplayer', [...this.MPLAYER_OPTIONS, '-volume', `${this.RADIO_VOLUME}`, url], { stdio: ['pipe', 'pipe', 'pipe'] });
        } else {
            // Already playing, change the URL
            this.radio_process.stdio[0].write(`pausing_keep_force loadfile ${url}\n`);
            this.radio_process.stdio[0].write('pausing_keep pause\n');
        }
        this.is_radio_playing = true;
    }

    /**
     * Start playing static.
     */
    playStatic() {
        if (this.is_static_playing) return;

        if (!this.static_process) {
            this.static_process = spawn('mplayer', [...this.MPLAYER_OPTIONS, '-volume', `${this.STATIC_VOLUME}`, this.STATIC_FILE], { stdio: ['pipe', 'pipe', 'pipe'] });
        } else {
            // Process already exists, unpause it
            console.log('Playing static');
            this.static_process.stdio[0].write('pausing_keep pause\n');
        }
        this.is_static_playing = true;
    }

    /**
     * Pause static
     */
    pauseStatic() {
        if (!this.is_static_playing) return;

        if (this.static_process) {
            console.log('Pausing static');
            this.static_process.stdio[0].write('pausing_toggle pause\n');
        }

        this.is_static_playing = false;
    }

    /**
     * Pause playback
     */
    pauseRadio() {
        if (!this.is_radio_playing) return;

        if (this.radio_process) {
            console.log('Pausing radio');
            this.radio_process.stdio[0].write('pausing_toggle pause\n');
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
        this.adc_window_sum -= this.adc_window.shift() ?? 0;
        const filtered_value = Math.floor(this.adc_window_sum / this.FILTER_WINDOW_SIZE);

       // console.log(`ADC: ${raw_value}, filtered: ${filtered_value}`);

        return filtered_value;
    }

    /**
     * Find the nearest center ADC value to the given ADC value.
     * @param adc_value 
     */
    findNearestCenter(adc_value: number): number {
        // TODO: cache these?
        return this.adc_stations.reduce((a, b) => Math.abs(b - adc_value) < Math.abs(a - adc_value) ? b : a);
    }

    /**
     * Continuously monitor the tuning ADC and play the appropriate station.
     * Never returns.
     */
    public async tune() {

        var is_locked = false;
        var locked_center = 0;
        var first_tune_on_band = true;

        // How close we need to be to a station center to lock onto it
        const PULL_IN_THRESHOLD = 3;
        // How far we need to wander from the center of a locked station to unlock from it
        const PULL_OFF_THRESHOLD = 7;

        // Seed the sliding window with the current raw ADC value
        const adc = this.adc.readAdc();
        console.log(`Seeding filter with ${adc}`);
        this.initFilter(adc);

        while (true) {
            await sleep(100);

            // Check if our band selector has changed
            const band = pollBandSelector();
            if (band !== this.current_band) {
                console.log(`Switching band to ${band}`);
                this.current_band = band;
                first_tune_on_band = true;
                if (band == Band.OFF) {
                    // Switching off
                    this.pauseRadio();
                    this.pauseStatic();
                } else {
                    // Switching to a different band
                    this.populateBand(band);
                    is_locked = false;
                    locked_center = 0;
                    this.pauseRadio();
                    this.pauseStatic();
                }
            }

            if (band === Band.OFF) {
                await sleep(400);
                continue;
            }

            try {
                // Get the tuning knob A/D value
                let filtered_adc_value = this.getFilteredAdcValue();

                if (is_locked) {
                    // Currently Locked
                    if (Math.abs(filtered_adc_value - locked_center) > PULL_OFF_THRESHOLD) {
                        // Unlock
                        console.log(`Unlocking, filtered:${filtered_adc_value} last_locked:${locked_center}`);
                        is_locked = false;
                        this.pauseRadio();
                        this.playStatic();
                    } else {
                        // Still locked. Keep playing radio.
                    }
                } else {
                    // Currently not locked. Check if we should lock on a station.
                    // Find the nearest center ADC value and if it's close enough lock onto it.
                    const nearest_center = this.findNearestCenter(filtered_adc_value);
                    if (Math.abs(nearest_center - filtered_adc_value) <= PULL_IN_THRESHOLD) {
                        // Lock
                        const url = this.adc_to_url[nearest_center];
                        console.log(`Locking. center:${nearest_center} adc:${filtered_adc_value} ${url}`);
                        locked_center = nearest_center;
                        is_locked = true;
                        this.pauseStatic();
                        this.playRadio(url);
                    } else {
                        // Still unlocked unlocked, keep playing static.
                        if (first_tune_on_band) {
                            this.playStatic();
                        }
                    }
                }
            } catch (e) {
                console.error(`Caught error reading ADC: ${e}\n`);
            }

            first_tune_on_band = false;
        }
    }
}
