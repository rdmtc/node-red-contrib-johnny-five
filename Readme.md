node-red-contrib-johnny-five
========================

A set of input and output nodes for controlling General Purpose Input and Outputs (GPIOs) though the use of [johnny-five](https://github.com/rwaldron/johnny-five) [I/O Plugins](https://github.com/rwaldron/johnny-five/wiki/IO-Plugins) as well as running johnny-five scripts!

## Install via NPM

From inside your node-red directory:
```
npm install node-red-contrib-johnny-five
```

## Control I/O for Analog, Digital, PWM and Servos

![input output](in_out.png)

## Also Read and Write to i2c devices
![i2c](i2c.png)

Node configuration
* 14 is the length of bytes to read (1 byte = 8 bits)
* i2c bytes is an array of bytes. You can't use inject node directly because data has to be inside an array.
```
msg.payload=[0x00]
return msg;
```
* i2c read and i2c write configure i2c connection. I2c and register are decimal values! parseInt(x, 10) function is used to read values.

## Now with full Johnny-five support!

![j5node](j5node.png)

## Supported Hardware

node-red-contrib-johnny-five supports several johnny-five I/O classes:

| Device | IO Plugin |
|----------|-------------|
|Arduino/Firmata|[firmata](https://github.com/jgautier/firmata)|
|Raspberry Pi|[raspi-io](https://github.com/bryan-m-hughes/raspi-io)|
|BeagleBone Black, Green, Pocket|[beaglebone-io](https://github.com/julianduque/beaglebone-io)|
|C.H.I.P.|[chip-io](https://github.com/sandeepmistry/node-chip-io)|
|Galileo/Edison|[galileo-io](https://github.com/rwaldron/galileo-io/)|
|Blend Micro|[blend-micro-io](https://github.com/noopkat/blend-micro-io)|
|LightBlue Bean|[bean-io](https://github.com/monteslu/bean-io/)|
|ble-io(esp32, curie)|[ble-io](https://github.com/monteslu/ble-io/)|
|Circuit Playground(classic)|[playground-io](https://github.com/rwaldron/playground-io)|
|Electirc Imp|[imp-io](https://github.com/rwaldron/imp-io/)|
|Particle(Spark) Core|[particle-io](https://github.com/rwaldron/particle-io/)|


Arduino is supported out of the box, but for other devices, you'll need to install their IO plugin.

For example to install the Raspberry Pi plugin:

```
npm install raspi-io
```


## Remote Arduino Support

If you're using Arduino/Firmata, you can connect to a remote device via a raw tcp socket, or an MQTT connection.

For example, if you wanted to connect using tcp, in node-red you could specify an ip and port.  On another machine with an Arduino plugged in you could run a server that relays a tcp socket to a serial port such as: [tcpSerialRelay.js](https://gist.github.com/monteslu/b5ad4c46c9b6b78f7aea)

If you wanted to connect an Arduino to an MQTT server you can use a script such as: [bindSerialToMQTT.js](https://gist.github.com/monteslu/64372bcdff6f56458ec6).  In node-red you can connect to the same MQTT server and subscribe to the topic the arduino is publishing on, while publishing to the topic that the arduino is subscribed to.


## License

MIT 

Copyright (c) 2019 Sebastian Raff    
Copyright (c) 2015 Luis Montes    

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
