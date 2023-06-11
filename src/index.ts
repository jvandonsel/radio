import { AdcConverter } from "./adc";


var adc: AdcConverter;
try {
    console.log("Initializing ADC...");
    adc = new AdcConverter();
    console.log("Initialized ADC.");
} catch(e) {
    console.error(`Caught error initializing ADC: ${e}\n`);
    throw e;
}

function sleep(time_ms: number) {
    return new Promise((resolve) => setTimeout(resolve, time_ms));
}


async function main() {
    while (true) {
        try {
            const value: number = adc.readAdc();
            console.log(value);
        } catch (e) {
            console.error(`Caught error reading ADC: ${e}\n`);
        }


        await sleep(250);
    }
}

main();
