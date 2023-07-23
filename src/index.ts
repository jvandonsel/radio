/**
 * Entry point for Tivoli Streaming Radio Appliance
 */

import {Tuner} from "./tuner";

async function main() {
    const tuner = new Tuner();
    await tuner.tune()
}

main();
