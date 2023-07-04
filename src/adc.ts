/**
 * MPC3008 A/D Converter
 */

import { openSync, SpiDevice, SpiMode, MODE3 } from 'spi-device';

export class AdcConverter {

    BUS = 0;
    DEVICE = 0;
    CHANNEL = 0;
    SPEED_HZ = 500000;

    spi: SpiDevice;
    sendBytes: number[];

    public constructor() {
        this.spi = openSync(this.BUS, this.DEVICE, {mode: 3});
        this.sendBytes = [0x01, 0x80 | (this.CHANNEL << 4), 0x00];
    }

    /**
     * Reads a value from the ADC
     * @returns An ADC value between 0 and 1023
     */
    public readAdc(): number {
        const message = [{
            sendBuffer: Buffer.from(this.sendBytes),
            receiveBuffer: Buffer.alloc(3),
            byteLength: 3,
            speedHz: this.SPEED_HZ
        }];

        this.spi.transferSync(message);
        const out = (message[0].receiveBuffer[1] << 8 | message[0].receiveBuffer[2]) & 0x03FF
        return out
    }

}

