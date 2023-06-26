import {Gpio} from 'onoff';

// GPIOs used to detect the band switch position.
const band_a_gpio = new Gpio(492, 'in');
const band_b_gpio = new Gpio(493, 'in');
const band_c_gpio = new Gpio(494, 'in');

export enum Band {
    OFF,
    A,
    B,
    C
}

/**
 * Reads GPIOs and determines the band selector position
 * @returns Band selector position
 */
export function poll_band_selector() {
  console.log(`fm=${band_a_gpio.readSync()} am=${band_b_gpio.readSync()} aux=${band_c_gpio.readSync()}`);

  if (band_a_gpio.readSync() === 0) {
    return Band.B;
  }
  if (band_b_gpio.readSync() === 0) {
    return Band.A;
  }
  if (band_c_gpio.readSync() === 0) {
    return Band.C;
  }
  return Band.OFF;
}


