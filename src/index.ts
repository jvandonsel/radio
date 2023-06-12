import {Tuner} from "./tuner";

async function main() {
    const tuner = new Tuner();
    await tuner.tune()
}

main();
