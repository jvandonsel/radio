import spidev
import time

spi = spidev.SpiDev()
spi.open(0,0)


spi.max_speed_hz = 5000000
spi.mode = 0b11


while True:
    result = spi.xfer2([0x01, 0x80, 0x00])
    out = (result[1] << 8 | result[2]) & 0x03FF
    
    print(f"{hex(result[0])} {hex(result[1])} {hex(result[2])}")
    print(out)
    time.sleep(0.250)

