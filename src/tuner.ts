import { AdcConverter } from "./adc";
import { sleep } from "./utils";
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { urls } from "./urls";

export class Tuner {

    // A/D values from the left to the right side of the tuning dial
    MIN_ADC_VALUE: number = 451;
    MAX_ADC_VALUE: number = 748;

    MPLAYER_OPTIONS = ["-loop", "0",  "-ao",  "pulse", "-really-quiet"];

    // Static file
    // TODO: Move this someplace else
    STATIC_FILE: string = "/static1.wav";

    // Width of each station on the dial in A/D values
    WIDTH: number = 1;

    // Filter window size in samples
    FILTER_WINDOW_SIZE = 20;

    adc: AdcConverter;
    adc_window: number[] = [];
    adc_to_url: Record<number, string> = {};
    radio_process: ChildProcessWithoutNullStreams | undefined = undefined;
    static_process: ChildProcessWithoutNullStreams | undefined = undefined;
    adc_centers: number[] = [];


    public constructor() {
        this.adc = new AdcConverter();

        const num_urls = Object.keys(urls).length;
        console.log(`Found ${num_urls} URLs`);

        // Space our URLs across the dial evenly.
        const url_step = Math.floor((this.MAX_ADC_VALUE - this.MIN_ADC_VALUE) / num_urls);
        console.log(`step size=${url_step}`);

        for (let i = 0; i < num_urls; ++i) {
            const center = url_step * i + this.MIN_ADC_VALUE;
            this.adc_centers.push(center);

            console.log(`Mapping center ${center} to ${urls[i]}`);

            // Give each station some width on the dial
            for (let k = -this.WIDTH; k <= this.WIDTH; ++k) {
                this.adc_to_url[center + k] = urls[i];
            }
        }

        // Initialize FIR filter
        for (let i = 0; i < this.FILTER_WINDOW_SIZE; ++i) {
            this.adc_window.push(0);
        }
    }

    /**
     * Start playing the given URL 
     * @param url URL to play
     */
    playUrl(url: string) {
        this.radio_process = spawn('mplayer',  [...this.MPLAYER_OPTIONS, url], {stdio: ['pipe', 'pipe', 'pipe']});
        console.log(`Starting play process with PID ${this.radio_process.pid}`);
    }

    /**
     * Stop playing the current URL.
     */
    stopPlayingUrl() {
        if (this.radio_process) {
            console.log(`Killing play process ${this.radio_process.pid}`);
            this.radio_process.stdio[0].write('q');
        }
        this.radio_process = undefined;
    }

    /**
     * Stop all sound
     */
    stopAll() {
        this.stopPlayingUrl();
        this.killStatic();
    }

    /**
     * Resume playing static, or start playing static if we haven't yet.
     */
    resumeStatic() {
        if (!this.static_process) {
            this.static_process = spawn('mplayer', [...this.MPLAYER_OPTIONS, this.STATIC_FILE]);
        } else {
            console.log("Unpausing static");
            this.static_process.kill('SIGCONT');
        }
    }

    /**
     * Pause playing static.
     */
    pauseStatic(){
        if (this.static_process) {
            console.log("Pausing static");
            this.static_process.kill('SIGSTOP');
        }
    }

    killStatic(){
        if (this.static_process) {
            console.log("Killing static")
            this.static_process.kill('SIGKILL');
        }
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
        this.adc_window.shift();
        const window_sum = this.adc_window.reduce((a, b) => a + b, 0);
        const filtered_value = Math.floor(window_sum / this.FILTER_WINDOW_SIZE);

        //console.log(`ADC: ${raw_value}, filtered: ${filtered_value}`);

        return filtered_value;
    }

    /**
     * Find the nearest center ADC value to the given ADC value.
     * @param adc_value 
     */
    findNearestCenter(adc_value: number): number {
        // TODO: cache these?
        return this.adc_centers.reduce((a, b) => Math.abs(b - adc_value) < Math.abs(a - adc_value) ? b : a);
    }

    /**
     * Continuously monitor the tuning ADC and play the appropriate station.
     * Never returns.
     */
    public async tune() {

        var is_locked = false;
        var locked_center = 0;

        // How close we need to be to a station center to lock onto it
        const PULL_IN_THRESHOLD = 5;
        // How far we need to wander from the center of a locked station to unlock from it
        const PULL_OFF_THRESHOLD = 8;

        // Start playing static
        this.resumeStatic();

        while (true) {
            await sleep(100);

            try {
                const filtered_adc_value = this.getFilteredAdcValue();
                
                if (is_locked) {
                    // Currently Locked
                    if (Math.abs(filtered_adc_value - locked_center) > PULL_OFF_THRESHOLD) {
                        console.log("Unlocking");
                        is_locked = false;
                        this.stopPlayingUrl()
                        this.resumeStatic()
                    } else {
                        // Still locked. Keep playing.
                    }
                } else {
                    // Currently not locked. Check if we should lock on a station.
                    // Find the nearest center ADC value and if it's close enough lock onto it.
                    const nearest_center = this.findNearestCenter(filtered_adc_value);  
                    if (Math.abs(nearest_center - filtered_adc_value) <= PULL_IN_THRESHOLD) {
                        const url = this.adc_to_url[nearest_center];
                        console.log(`Playing ${nearest_center} ${url}`);
                        locked_center = nearest_center;
                        is_locked = true;
                        this.pauseStatic();
                        this.stopPlayingUrl();
                        this.playUrl(url);
                    } else {
                        // Stay unlocked
                    }
                }
            } catch (e) {
                console.error(`Caught error reading ADC: ${e}\n`);
            }
        }
    }
}