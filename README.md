
# Streaming Radio Appliance

## Overview
This is a streaming radio appliance built inside the chassis of an old [Tivoli Audio Model One Radio](https://tivoliaudio.com/products/model-one-classic-retro-am-fm-table-radio).  All electronics in the original radio were removed, and this project uses only:
- Cabinet
- Speaker
- Volume knob
- Band switch
- Tuning knob


## Hardware
I used the [Libre Potato](https://libre.computer/products/aml-s905x-cc/) as my main controller. It's very similar to a Raspberry Pi 4.  It has no WiFi, so a cheap WiFi USB adapter was added.

A USB wall power supply is connected to this [12V supply from AdaFruit](https://www.adafruit.com/product/2778).  The 12v powers a [20W stereo amplifier](https://www.adafruit.com/product/1752) from AdaFruit, though I'm only using one stereo channel.

I stepped down the 12v to 5v for the Libre board using a [Buck Boost](https://www.sparkfun.com/products/15208) board from Sparkfun. In retrospect, this is kinda silly: The USB wall supply generates 5v, and the AdaFruit 12v adapter steps this up to 12v for the amplifier, then the 12v is stepped down to 5v for the Libre board.  However, I was getting terrible noise problems in the amplifier when I ran both the Libre board and the amp off the same 5v source.

The band select switch originally switched between OFF, FM, AM, and AUX. I ended up needing to cut traces on the band selector PCB to isolate these 3 positions.  The switch is now connected to GPIOs on the Libre board and is used to choose between several sets of URLs: a set of BBC stations and a set of CBC stations.

The tuning knob on the Model one is especially nice. It's big and is geared way down.  It originally was tied to a variable capacitor for RF tuning purposes, but here I've connected it to a 10K potentiometer which is monitored by an [MCP3008 10-bit A/D converter](https://www.adafruit.com/product/856).

## Software

I've spent quite a bit of time trying to replicate the feel of tuning an analog radio with this device. Static is played between stations, and the radio tries to "lock onto" nearby stations.  It's still not the same experience as with an actual analog radio, though, and improvements will be coming.

This radio uses [mplayer](http://www.mplayerhq.hu) to play the actual radio streams. To speed up transitions betwen stations and between stations and static, two mplayer processes are started and kept running forever, one for radio and one for static. I start mplayer in slave mode, meaning commands to change the URL and to pause and resume the player are injected into stdin.



