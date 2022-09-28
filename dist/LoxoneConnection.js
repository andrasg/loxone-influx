"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LoxoneAPI = require("node-lox-ws-api");
const Logger_1 = require("./Logger");
const events_1 = require("events");
const LoxoneUpdateEvent_1 = require("./data/LoxoneUpdateEvent");
class LoxoneConnection extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        let host = config.get('loxone.host');
        let user = config.get('loxone.username');
        let password = config.get('loxone.password');
        this.loxoneAPI = new LoxoneAPI(host, user, password, true, 'AES-256-CBC' /*'Hash'*/);
        this.maxRetryDelayInMs = config.get('loxone.maxRetryDelayInSec') * 1000;
        this.setupEvents();
    }
    setupEvents() {
        var that = this;
        this.loxoneAPI.on('connect', function () {
            Logger_1.Logger.log_info("Loxone connected!");
            that.emit("connect");
        });
        this.loxoneAPI.on('reconnect', function () {
            Logger_1.Logger.log_info("Loxone reconnecting");
            that.emit("reconnect");
        });
        this.loxoneAPI.on('close', function (info, reason) {
            Logger_1.Logger.log_info("Loxone closed! (" + reason + ")");
            that.emit("close");
        });
        this.loxoneAPI.on('get_structure_file', function (filedata) {
            Logger_1.Logger.log_info("Got structure file! Last modified: " + filedata.lastModified);
            that.emit("get_structure_file");
        });
        this.loxoneAPI.on('send', function (message) {
            Logger_1.Logger.log_debug("Sent message");
            that.emit("send");
        });
        this.loxoneAPI.on('abort', function () {
            Logger_1.Logger.log_error("Loxone aborted!");
            process.exit();
        });
        this.loxoneAPI.on('close_failed', function () {
            Logger_1.Logger.log_error("Loxone close failed!");
            process.exit();
        });
        this.loxoneAPI.on('connect_failed', function (error, reason) {
            Logger_1.Logger.log_info('Loxone connect failed!');
        });
        this.loxoneAPI.on('connection_error', function (error, reason) {
            if (error != undefined) {
                Logger_1.Logger.log_info('Loxone connection error: ' + error.toString());
            }
            else {
                Logger_1.Logger.log_info('Loxone connection error');
            }
            that.emit("connection_error");
        });
        this.loxoneAPI.on('auth_failed', function (error) {
            Logger_1.Logger.log_info('Loxone auth error: ' + JSON.stringify(error));
        });
        this.loxoneAPI.on('authorized', function () {
            Logger_1.Logger.log_info('Loxone authorized');
            that.emit("authorized");
        });
        this.loxoneAPI.on('update_event_value', function (uuid, evt) {
            that.emit("update", new LoxoneUpdateEvent_1.LoxoneUpdateEvent(uuid, evt));
        });
        process.on('SIGINT', function () {
            that.loxoneAPI.abort();
        });
    }
    connect() {
        this.loxoneAPI.connect();
    }
}
exports.LoxoneConnection = LoxoneConnection;
//# sourceMappingURL=LoxoneConnection.js.map