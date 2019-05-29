const NodeLed = require('node-led');

module.exports = function (RED) {
    function J5Led(config) {
        RED.nodes.createNode(this, config);
        this.buttonState = -1;
        this.address = Number(config.address);
        this.mode = config.mode;
        this.arduino = config.arduino;
        this.board = RED.nodes.getNode(config.board);
        if (typeof this.board === 'object') {
            this.board.on('ioready', () => {
                this.comp = new NodeLed[this.mode](this.board.io, {address: this.address});

                this.on('input', msg => {
                    try {
                        if (this.mode === 'AlphaNum4' || this.mode === 'SevenSegment') {
                            this.comp.writeText(msg.payload);
                        } else {
                            this.comp.drawBitmap(msg.payload);
                        }
                    } catch (error) {
                        this.warn(error);
                        this.error(error.message);
                    }
                });
            });
            this.board.on('networkReady', () => {
            });
            this.board.on('networkError', () => {
            });
            this.board.on('ioError', err => {
            });
        } else {
            this.warn('nodebot not configured');
        }
    }

    RED.nodes.registerType('j5-led', J5Led);
};
