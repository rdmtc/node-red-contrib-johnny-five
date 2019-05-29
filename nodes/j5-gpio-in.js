module.exports = function (RED) {
    class J5GpioIn {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.buttonState = -1;
            this.pin = config.pin;
            this.state = config.state;
            this.platform = RED.nodes.getNode(config.platform);
            if (typeof this.platform === 'object') {
                //connectingStatus(node);

                this.platform.on('ioready', () => {
                    const {io} = this.platform;
                    console.log(this.pin, '=>', io.normalize(this.pin));
                    console.log(this.platform.board.pins[io.normalize(this.pin)]);
                    //connectedStatus(node);
                    if (this.state === 'ANALOG') {
                        const samplingInterval = parseInt(config.samplingInterval, 10) || 300;
                        try {
                            io.setSamplingInterval(samplingInterval);
                        } catch (error) {
                            this.error(error.message);
                            this.status({text: error.message, fill: 'red', shape: 'dot'});
                        }

                        try {
                            io.pinMode(this.pin, io.MODES.ANALOG);
                        } catch (error) {
                            this.error(error.message);
                            this.status({text: error.message, fill: 'red', shape: 'dot'});
                        }

                        io.analogRead(this.pin, data => {
                            const msg = {payload: data, topic: this.pin};
                            this.send(msg);
                        });
                    } else if (this.state === 'PULLUP') {
                        try {
                            io.pinMode(this.pin, io.MODES.PULLUP);
                        } catch (error) {
                            this.error(error.message);
                            this.status({text: error.message, fill: 'red', shape: 'dot'});
                        }

                        try {
                            io.digitalRead(this.pin, data => {
                                const msg = {payload: data, topic: this.pin};
                                this.status({text: String(data), fill: this.statusFill});

                                this.send(msg);
                            });
                        } catch (error) {
                            this.error(error.message);
                            this.status({text: error.message, fill: 'red', shape: 'dot'});
                        }
                    } else {
                        try {
                            io.pinMode(this.pin, io.MODES.INPUT);
                        } catch (error) {
                            this.error(error.message);
                            this.status({text: '', fill: this.statusFill});
                        }

                        try {
                            io.digitalRead(this.pin, data => {
                                const msg = {payload: data, topic: this.pin};
                                this.status({text: String(data), fill: this.statusFill});
                                this.send(msg);
                            });
                        } catch (error) {
                            this.error(error.message);
                            this.status({text: error.message, fill: 'red', shape: 'dot'});
                        }
                    }
                });

                this.platform.on('networkReady', () => {
                    this.statusFill = 'green';
                    this.status({text: 'connected', fill: this.statusFill});
                });
                this.platform.on('networkError', () => {
                    this.statusFill = 'red';
                    this.status({text: 'network error', fill: this.statusFill});
                });
                this.platform.on('ioError', err => {
                    this.status({text: err.message, fill: this.statusFill});
                });
            } else {
                this.warn('nodebot not configured');
            }
        }
    }

    RED.nodes.registerType('j5-gpio-in', J5GpioIn);
};
