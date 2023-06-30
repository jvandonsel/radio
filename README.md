# Streaming Radio Appliance

## Overview
This is a streaming radio appliance built inside the chassis of an old [Tivoli Audio Model One Radio](https://tivoliaudio.com/products/model-one-classic-retro-am-fm-table-radio).  All electronics in the original radio were removed, and this project uses the following components from the original radio:

- Wooden Cabinet
- Front and back panels
- Speaker
- Volume knob
- Band switch
- Tuning knob


## Hardware
I used the [Libre Potato](https://libre.computer/products/aml-s905x-cc/) as my main controller. It's similar to a Raspberry Pi 4, which is unobtainable right now.  This board has no WiFi, so a cheap WiFi USB adapter was added.

A USB wall power supply is connected to this [12V USB booster from AdaFruit](https://www.adafruit.com/product/2778).  The 12v powers a [20W stereo amplifier](https://www.adafruit.com/product/1752) from AdaFruit, though I'm only using one stereo channel.

The band select switch originally switched between OFF, FM, AM, and AUX. I ended up needing to cut traces on the band selector PCB to isolate these 3 positions in the switch.  The switch is now connected to GPIOs on the Libre board and is used to choose between three sets of URLs: a set of BBC stations a set of CBC station, and a set of US stations.

The volume control pot is wired directly to the amplifier board.

The tuning knob on the Model one is especially nice. It's big and is geared way down.  It originally was connected to a variable capacitor for RF tuning purposes, but here I've connected it to a 10K potentiometer which is monitored by an [MCP3008 10-bit A/D converter](https://www.adafruit.com/product/856) over SPI.

## Software

The player software is written in Typescript and runs under node.js.  Two special purpose Node modules are used:

- [spi-device](https://www.npmjs.com/package/spi-device) For SPI access to the ADC
- [onoff](https://www.npmjs.com/package/onoff) For GPIO control

I've spent quite a bit of time trying to replicate the feel of tuning an analog radio with this device. Static is played between stations, and the radio tries to "lock onto" nearby stations.  It's still not the same experience as with an actual analog radio, though, and I can see this being a never ending source of tweaks.

This radio uses [mplayer](http://www.mplayerhq.hu) to play the actual radio streams. To speed up transitions betwen stations and between stations and static, two mplayer processes are started and kept running forever, one for radio and one for static. I start mplayer in slave mode, meaning commands to change the URL and to pause and resume the player are injected into stdin.

Code was composed in [Emacs](https://www.gnu.org/software/emacs/).



