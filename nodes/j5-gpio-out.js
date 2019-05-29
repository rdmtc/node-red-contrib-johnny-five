module.exports = function (RED) {
    class J5GpioOut {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.buttonState = -1;
            this.pin = config.pin;
            this.state = config.state;
            this.arduino = config.arduino;
            this.platform = RED.nodes.getNode(config.platform);
            this.i2cAddress = parseInt(config.i2cAddress, 10);
            this.i2cRegister = parseInt(config.i2cRegister, 10);
            if (!this.platform) {
                this.error('platform missing');
            }
               
                this.platform.on('ioready', () => {
                    this.log('ioready')

                    this.on('input', msg => {
                        try {
                            const state = msg.state || this.state;
                            const {io} = this.platform;
                            if (state === 'OUTPUT') {
                                try {
                                    io.pinMode(this.pin, io.MODES[state]);
                                } catch (error) {
                                    this.error(error.message);
                                    this.status({text: error.message, fill: 'red', shape: 'dot'});
                                }

                                if ((msg.payload == true) || (msg.payload == 1) || (msg.payload.toString().toLowerCase() === 'on')) {
                                    io.digitalWrite(this.pin, 1);
                                }

                                if ((msg.payload == false) || (msg.payload == 0) || (msg.payload.toString().toLowerCase() === 'off')) {
                                    io.digitalWrite(this.pin, 0);
                                }
                            } else if (state === 'PWM') {
                                try {
                                    io.pinMode(this.pin, io.MODES[state]);
                                } catch (error) {
                                    console.error(error);
                                    this.error(error.message);
                                    this.status({text: error.message, fill: 'red', shape: 'dot'});
                                }

                                msg.payload = Number(msg.payload);
                                if ((msg.payload >= 0) && (msg.payload <= 255)) {
                                    // Console.log(msg.payload, this.pin);
                                    io.analogWrite(this.pin, msg.payload);
                                }
                            } else if (state === 'SERVO') {
                                try {
                                    io.pinMode(this.pin, io.MODES[state]);
                                } catch (error) {
                                    this.error(error.message);
                                    this.status({text: error.message, fill: 'red', shape: 'dot'});
                                }

                                msg.payload = Number(msg.payload);
                                if ((msg.payload >= 0) && (msg.payload <= 180)) {
                                    // Console.log(msg.payload, this.pin);
                                    io.servoWrite(this.pin, msg.payload);
                                }
                            } else if (this.state === 'I2C_READ_REQUEST') {
                                var register = parseInt(msg.i2cRegister, 10) || parseInt(this.i2cRegister, 10);
                                var i2cAddress = parseInt(msg.i2cAddress, 10) || parseInt(this.i2cAddress, 10);
                                const numBytes = parseInt(msg.payload, 10);
                                if (io.i2cReadOnce && i2cAddress && numBytes) {
                                    if (register) {
                                        io.i2cReadOnce(i2cAddress, register, numBytes, data => {
                                            this.send({
                                                payload: data,
                                                register,
                                                i2cAddress,
                                                numBytes
                                            });
                                        });
                                    } else {
                                        io.i2cReadOnce(i2cAddress, numBytes, data => {
                                            this.send({
                                                payload: data,
                                                i2cAddress,
                                                numBytes
                                            });
                                        });
                                    }
                                }
                            } else if (this.state === 'I2C_WRITE_REQUEST') {
                                var register = parseInt(msg.i2cRegister, 10) || parseInt(this.i2cRegister, 10);
                                var i2cAddress = parseInt(msg.i2cAddress, 10) || parseInt(this.i2cAddress, 10);
                                if (io.i2cWrite && i2cAddress && msg.payload) {
                                    if (register) {
                                        io.i2cWrite(i2cAddress, register, msg.payload);
                                    } else {
                                        io.i2cWrite(i2cAddress, msg.payload);
                                    }
                                }
                            } else if (this.state === 'I2C_DELAY') {
                                if (io.i2cConfig) {
                                    if (register) {
                                        io.i2cConfig(parseInt(msg.payload, 10));
                                    }
                                }
                            }
                        } catch (error) {
                            this.warn(error);
                        }
                    });
                });
                this.platform.on('networkReady', () => {
                });
                this.platform.on('networkError', () => {
                });
                this.platform.on('ioError', err => {
                });

        }
    }

    RED.nodes.registerType('j5-gpio-out', J5GpioOut);
};
