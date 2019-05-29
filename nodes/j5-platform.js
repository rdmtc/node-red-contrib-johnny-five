const five = require('johnny-five');

const ioPlugins = [];
[
    'firmata',
    'raspi-io',
    'beaglebone-io',
    'galileo-io',
    'blend-micro-io',
    'ble-io',
    'bean-io',
    'imp-io',
    'particle-io',
    // 'pinoccio-io', TODO https://github.com/soldair/pinoccio-io/
    'playground-io',
    'tinker-io',
    'chip-io',
    'tessel-io',
    'linux-io',
    'odroid-io'
].forEach(plugin => {
    try {
        require.resolve(plugin);
        ioPlugins.push(plugin);
    } catch (err) {}
});

const platforms = {};

module.exports = function (RED) {
    class J5Platform {
        constructor(config) {
            RED.nodes.createNode(this, config);

            this.ioPluginName = config.ioPlugin;

            try {
                this.ioPlugin = require(config.ioPlugin);
            } catch (error) {
                this.error('error loading plugin ' + config.ioPlugin + ' ' + error.message);
                this.emit('ioError', error);
                return;
            }

            this.ioClass = this.ioPlugin;
            this.ioArgs = [];

            switch (config.ioPlugin) {
                case 'playground-io':
                    this.ioArgs = [{
                        port: config.serialportName,
                        serialport: {baudRate: 57600, bufferSize: 256, lock: false},
                        reportVersionTimeout: 200
                    }];
                    this.startPlugin();
                    break;

                case 'bean-io':
                    this.ioClass = this.ioPlugin.Board;
                    this.ioArgs = [{uuid: config.beanId}];
                    this.startPlugin();
                    break;

                case 'imp-io':
                    this.ioArgs = [{agent: config.impId}];
                    this.startPlugin();
                    break;

                case 'spark-io':
                    this.ioArgs = [{deviceId: config.sparkId, token: config.sparkToken}];
                    this.startPlugin();
                    break;

                case 'raspi-io':
                    const excludePins = [];
                    for (let i = 2; i <= 26; i++) {
                        if (!(config.raspiGPIO && config.raspiGPIO.includes('GPIO' + i))) {
                            excludePins.push('GPIO' + i);
                        }
                    }

                    this.ioClass = this.ioPlugin.RaspiIO;
                    this.ioArgs = [{enableSerial: config.raspiUART, enableI2C: config.raspiI2C, excludePins}];
                    this.startPlugin();
                    break;

                case 'firmata':
                    this.ioClass = this.ioPlugin.Board;
                    switch (config.connectionType) {
                        case 'local':
                            this.ioArgs = [config.serialportName, {serialport: {baudRate: 57600, bufferSize: 256, lock: false}}];
                            this.startPlugin();
                            break;

                        case 'mqtt':
                            // TODO use MQTT Core node!
                            const mqtt = require('mqtt');

                            const client = mqtt.connect(config.mqttServer, {
                                username: config.username,
                                password: config.password
                            });
                            client.on('error', err => {
                                this.error(err.message);
                            });

                            this.sp = new require('mqtt-serial').SerialPort({
                                client,
                                transmitTopic: config.pubTopic,
                                receiveTopic: config.subTopic
                            });

                            this.ioArgs = [this.sp, {samplingInterval: 300, reportVersionTimeout: 15000}];
                            this.startPlugin();
                            break;

                        case 'tcplisten': {
                            const net = require('net');
                            this.tcpServer = net.createServer(socket => {
                                this.log('listening on ' + socket.remoteAddress + ':' + socket.remotePort);
                                socket.emit('open', {});
                                socket.on('error', err => {
                                    console.log('tcp error', err);
                                    this.error(err);
                                    this.emit('networkError', err);
                                });

                                this.ioArgs = [socket];
                                this.startPlugin();
                            }).listen(parseInt(config.tcpPort, 10));
                            break;
                        }

                        case 'tcp': {
                            const net = require('net');
                            this.client = net.connect({
                                host: config.tcpHost,
                                port: parseInt(config.tcpPort, 10)
                            });
                            this.client.on('connect', () => {
                                this.log('connected to ' + config.tcpHost + ':' + config.tcpPort);
                                client.emit('open', {});
                            });
                            this.client.on('error', err => {
                                this.error('tcp error ' + err.message);
                                this.emit('networkError', err);
                            });

                            this.ioArgs = [this.client];
                            this.startPlugin();
                            break;
                        }

                        case 'udp': {
                            this.sp = new require('udp-serial').SerialPort({
                                host: config.tcpHost,
                                port: parseInt(config.tcpPort, 10),
                                type: 'udp4'
                            });
                            this.sp.on('error', err => {
                                this.error(err.message);
                                this.emit('networkError', err);
                            });

                            this.ioArgs = [this.sp, {reportVersionTimeout: 10}];
                            this.startPlugin();
                            break;
                        }

                        default:
                            this.error('unknown connectionType ' + config.connectionType);
                    }

                    break;

                default:
                    this.startPlugin();
            }

            this.on('close', done => this.stopPlugin(done));
        }

        startPlugin() {
            this.debug('start plugin ' + this.ioPluginName + ' ' + JSON.stringify(this.ioArgs));

            try {
                this.io = new this.ioClass(...this.ioArgs);
            } catch (err) {
                this.error(err.message);
                return;
            }

            this.io.on('error', err => {
                this.error('io ' + err.message);
            });

            this.io.on('connect', () => {
                this.debug('io connected');
                this.emit('networkReady', this.io);
            });

            this.board = new five.Board({io: this.io, id: this.id, repl: false, timeout: 2e4});
            this.board.on('ready', () => {
                this.debug('board ready');

                platforms[this.id] = this.board;


                process.nextTick(() => {
                    this.emit('ioready', this.io);
                });
            });

            this.board.on('error', err => {
                this.error('board ' + err.message);
            });
        }

        stopPlugin(done) {
            try {
                if (this.tcpServer) {
                    try {
                        this.tcpServer.close();
                    } catch (error) {
                        this.error(error);
                    }
                }

                if (this.io.close) {
                    this.io.close();
                } else if (this.io.sp) {
                    if (this.io.sp.close) {
                        this.io.sp.close();
                    } else if (this.io.sp.end) {
                        this.io.sp.end();
                    }
                }

                if (this.client && this.client.stop) {
                    this.client.stop();
                }

                if (this.client && this.client.close) {
                    this.client.close();
                }

                // Todo!
                const cachedBoards = [];
                five.Board.cache.forEach(() => {
                    five.Board.cache.pop();
                });

                cachedBoards.forEach(board => {
                    if (board !== this.board) {
                        five.Board.cache.push(board);
                    }
                });

                // Try and cleanup board
                this.board.register.forEach(component => {
                    try {
                        if (component.stop) {
                            component.stop();
                        } else if (component.state && component.state.intervalId) {
                            clearInterval(component.state.intervalId);
                        } else if (component.state && component.state.interval) {
                            clearInterval(component.state.interval);
                        }

                        component.io = null;
                        component.board = null;
                    } catch (error) {
                        console.log('error trying to cleanup component', error);
                    }
                });
                this.board.io = null;

                done();
            } catch (error) {
                console.log('error closing', error);
                done();
            }
        }
    }

    RED.nodes.registerType('j5-platform', J5Platform);

    function listArduinoPorts(callback) {
        return serialport.list((err, ports) => {
            if (err) {
                return callback(err);
            }

            const devices = [];
            for (let i = 0; i < ports.length; i++) {
                if (/usb|acm|com\d+/i.test(ports[i].comName)) {
                    devices.push(ports[i].comName);
                }
            }

            return callback(null, devices);
        });
    }

    // Routes
    RED.httpAdmin.get('/johnny5/serialports', RED.auth.needsPermission('arduino.read'), (req, res) => {
        listArduinoPorts((err, ports) => {
            res.json(ports);
        });
    });

    RED.httpAdmin.get('/johnny5/io-plugins', (req, res) => {
        res.json(ioPlugins);
    });
};
