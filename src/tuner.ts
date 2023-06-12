import { AdcConverter } from "./adc";
import { sleep } from "./utils";
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

const urls = [
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_one.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_1xtra.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_one_dance.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_one_relax.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_two.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_three.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_fourfm.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_four_extra.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_radio_five_live.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_6music.m3u8",
    "http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_world_service.m3u8"
];


export class Tuner {

    adc: AdcConverter;
    MIN_ADC_VALUE: number = 451;
    MAX_ADC_VALUE: number = 748;
    SLOP: number = 5;
    WINDOW_SIZE = 20;

    adc_window: number[] = [];
    adc_to_url: Record<number, string> = {};
    radio_process: ChildProcessWithoutNullStreams | undefined = undefined;
    static_process: ChildProcessWithoutNullStreams | undefined = undefined;


    public constructor() {
        this.adc = new AdcConverter();

        // Map our set of URLs equally distant along the ADC range
        const num_urls = Object.keys(urls).length;
        console.log(`Found ${num_urls} URLs`);
        const url_step = Math.floor((this.MAX_ADC_VALUE - this.MIN_ADC_VALUE) / num_urls);

        console.log(`step size=${url_step}`);

        for (let i = 0; i < num_urls; ++i) {
            let center = url_step * i + this.MIN_ADC_VALUE;

            console.log(`Mapping center ${center} to ${urls[i]}`);

            for (let k = -this.SLOP; k <= this.SLOP; ++k) {
                this.adc_to_url[center + k] = urls[i];
            }
        }

        // Initialize FIR filter
        for (let i = 0; i < this.WINDOW_SIZE; ++i) {
            this.adc_window.push(0);
        }
    }

    playUrl(url: string) {
            this.radio_process = spawn('mplayer',  ["-ao", "pulse", url]);
        console.log(`Starting play process with PID ${this.radio_process.pid}`);
    }

    stopUrl() {
        if (this.radio_process) {
            console.log(`Killing play process ${this.radio_process.pid}`);
            this.radio_process.kill('SIGKILL');
        }
        this.radio_process = undefined;
    }

    stopAll() {
        this.stopUrl();
        this.killStatic();
    }


    playStatic() {
        if (!this.static_process) {
            const file_loc = "/static1.wav";
            this.static_process = spawn('mplayer', ["-loop", "0",  "-ao",  "pulse", file_loc]);
        } else {
            console.log("Unpausing static");
            this.static_process.kill('SIGCONT');
        }
    }

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


    public async tune() {

        var last_adc_value = 0;
        const tuning_hysteresis = 3;
        while (true) {
            try {
                // Read a tuning value
                const adc_value: number = this.adc.readAdc();

                // Add to sliding window filter and get the filtered value
                this.adc_window.push(adc_value);
                this.adc_window.shift();
                const window_sum = this.adc_window.reduce((a, b) => a + b, 0);
                const filtered_adc_value = Math.floor(window_sum / this.WINDOW_SIZE);

                console.log(`ADC: ${adc_value}, filtered: ${filtered_adc_value} last=${last_adc_value}`);
                
                if (Math.abs(filtered_adc_value - last_adc_value) > tuning_hysteresis) {
                    if (filtered_adc_value in this.adc_to_url) {
                        const url = this.adc_to_url[filtered_adc_value];
                        console.log(`Playing: ${url}`);
                        this.pauseStatic();
                        this.stopUrl();
                        this.playUrl(url);
                    } else {
                        console.log("Playing static");
                        this.stopUrl()
                        this.playStatic()
                    }
                    last_adc_value = filtered_adc_value;
                }

            } catch (e) {
                console.error(`Caught error reading ADC: ${e}\n`);
            }

            await sleep(100);
        }
    }
}