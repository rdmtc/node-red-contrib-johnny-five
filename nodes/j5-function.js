module.exports = function (RED) {
    function J5Function(config) {
        RED.nodes.createNode(this, config);

        // Console.log('initializing johnny5Node', n);
        this.board = RED.nodes.getNode(config.board);
        this.func = config.func;

        if (typeof this.board === 'object') {
            process.nextTick(() => {
                connectingStatus(node);
            });

            // Console.log('launching johnny5Node', n);
            this.board.on('ioready', function () {
            // Console.log('launching johnny5Node ioready', n);
                connectedStatus(node);

                function sendResults(node, msgs) {
                    const _msgid = (1 + Math.random() * 4294967295).toString(16);
                    if (msgs == null) {
                        return;
                    }

                    if (!util.isArray(msgs)) {
                        msgs = [msgs];
                    }

                    let msgCount = 0;
                    for (let m = 0; m < msgs.length; m++) {
                        if (msgs[m]) {
                            if (util.isArray(msgs[m])) {
                                for (let n = 0; n < msgs[m].length; n++) {
                                    msgs[m][n]._msgid = _msgid;
                                    msgCount++;
                                }
                            } else {
                                msgs[m]._msgid = _msgid;
                                msgCount++;
                            }
                        }
                    }

                    if (msgCount > 0) {
                        this.send(msgs);
                    }
                }

                const functionText = 'var results = null;' +
                'results = (function(){ ' +
                'var node = {' +
                'log:__node__.log,' +
                'error:__node__.error,' +
                'warn:__node__.warn,' +
                'on:__node__.on,' +
                'status:__node__.status,' +
                'send:function(msgs){ __node__.send(msgs);}' +
                '};\n' +
                this.func + '\n' +
                '})();';

                const sandbox = {
                    console,
                    util,
                    Buffer,
                    __node__: {
                        log() {
                            this.log.apply(node, arguments);
                        },
                        error() {
                            this.error.apply(node, arguments);
                        },
                        warn() {
                            this.warn.apply(node, arguments);
                        },
                        send(msgs) {
                            sendResults(node, msgs);
                        },
                        on() {
                            this.on.apply(node, arguments);
                        },
                        status() {
                            this.status.apply(node, arguments);
                        }
                    },
                    context: {
                        set() {
                            return this.context().set.apply(node, arguments);
                        },
                        get() {
                            return this.context().get.apply(node, arguments);
                        },
                        get global() {
                            return this.context().global;
                        },
                        get flow() {
                            return this.context().flow;
                        }
                    },
                    flow: {
                        set() {
                            this.context().flow.set.apply(node, arguments);
                        },
                        get() {
                            return this.context().flow.get.apply(node, arguments);
                        }
                    },
                    global: {
                        set() {
                            this.context().global.set.apply(node, arguments);
                        },
                        get() {
                            return this.context().global.get.apply(node, arguments);
                        }
                    },
                    setTimeout,
                    clearTimeout,
                    _,
                    five,
                    board: this.board.board,
                    boardModule: this.board.boardModule,
                    RED,
                    require

                };
                const context = vm.createContext(sandbox);

                try {
                    this.script = vm.createScript(functionText);
                    try {
                        const start = Date.now(); // Process.hrtime();
                        // context.msg = msg;
                        this.script.runInContext(context);
                    // Console.log('ran script', context);
                    } catch (error) {
                        let line = 0;
                        let errorMessage;
                        const stack = error.stack.split(/\r?\n/);
                        if (stack.length > 0) {
                            while (line < stack.length && stack[line].indexOf('ReferenceError') !== 0) {
                                line++;
                            }

                            if (line < stack.length) {
                                errorMessage = stack[line];
                                const m = /:(\d+):(\d+)$/.exec(stack[line + 1]);
                                if (m) {
                                    const lineno = Number(m[1]) - 1;
                                    const cha = m[2];
                                    errorMessage += ' (line ' + lineno + ', col ' + cha + ')';
                                }
                            }
                        }

                        if (!errorMessage) {
                            errorMessage = error.toString();
                        }

                        this.error(errorMessage);
                    }
                } catch (error) {
                // Eg SyntaxError - which v8 doesn't include line number information
                // so we can't do better than this
                    this.error(error);
                }
            });
            this.board.on('networkReady', () => {
                networkReadyStatus(node);
            });
            this.board.on('networkError', () => {
                networkErrorStatus(node);
            });
            this.board.on('ioError', err => {
                ioErrorStatus(node, err);
            });
        } else {
            this.warn('nodebot not configured');
        }
    }

    RED.nodes.registerType('j5-function', J5Function);
};
