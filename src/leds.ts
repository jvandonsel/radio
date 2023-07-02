import {Gpio} from 'onoff';

const power_led_gpio = new Gpio(495, 'out');
const tuning_led_gpio = new Gpio(480, 'out');

export function set_power_led(on: boolean) {
    power_led_gpio.writeSync(on ? 1: 0);
}


export function set_tuning_led(on: boolean) {
    tuning_led_gpio.writeSync(on ? 1: 0);
}
