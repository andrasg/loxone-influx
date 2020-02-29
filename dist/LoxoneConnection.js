"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LoxoneAPI = require("node-lox-ws-api");
const Logger_1 = require("./Logger");
const events_1 = require("events");
const cluster_1 = require("cluster");
const LoxoneUpdateEvent_1 = require("./data/LoxoneUpdateEvent");
class LoxoneConnection extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        let host = config.get('loxone.host');
        let user = config.get('loxone.username');
        let password = config.get('loxone.password');
        this.loxoneAPI = new LoxoneAPI(host, user, password, true, 'AES-256-CBC' /*'Hash'*/);
        this.maxRetryDelayInMs = config.get('intervals.maxRetryDelayInSec') * 1000;
        this.setupEvents();
    }
    setupEvents() {
        var that = this;
        this.loxoneAPI.on('connect', function () {
            Logger_1.Logger.log_info("Loxone connected!");
        });
        this.loxoneAPI.on('close', function () {
            that.emit("close");
            Logger_1.Logger.log_info("Loxone closed!");
        });
        this.loxoneAPI.on('abort', function () {
            Logger_1.Logger.log_info("Loxone aborted!");
            process.exit();
        });
        this.loxoneAPI.on('close_failed', function () {
            Logger_1.Logger.log_info("Loxone close failed!");
            process.exit();
        });
        this.loxoneAPI.on('connect_failed', function (error) {
            Logger_1.Logger.log_info('Loxone connect failed!');
        });
        this.loxoneAPI.on('connection_error', function (error) {
            cluster_1.emit("connection_error");
            if (error != undefined) {
                Logger_1.Logger.log_info('Loxone connection error: ' + error.toString());
            }
            else {
                Logger_1.Logger.log_info('Loxone connection error');
            }
            that.retryConnect();
        });
        this.loxoneAPI.on('auth_failed', function (error) {
            Logger_1.Logger.log_info('Loxone auth error: ' + JSON.stringify(error));
        });
        this.loxoneAPI.on('authorized', function () {
            cluster_1.emit("authorized");
            that.retryCount = 0;
            Logger_1.Logger.log_info('Loxone authorized');
            setTimeout(function () { that.loxoneAPI.send_command('jdev/cfg/version'); }, 5000);
        });
        this.loxoneAPI.on('update_event_value', function (uuid, evt) {
            that.emit("update", new LoxoneUpdateEvent_1.LoxoneUpdateEvent(uuid, evt));
        });
        process.on('SIGINT', function () {
            that.loxoneAPI.abort();
        });
    }
    retryConnect() {
        this.retryCount++;
        var delayInMilliseconds = this.getExponentialFallbackDelay(this.retryCount);
        Logger_1.Logger.log_info('Sleeping for ' + delayInMilliseconds + ' milliseconds before retrying...' + this.retryCount);
        setTimeout(function () { this.loxoneAPI.connect(); }, delayInMilliseconds);
    }
    getExponentialFallbackDelay(retryCount) {
        var delayInMilliseconds = 0.5 * (Math.pow(2, retryCount) - 1) * 1000;
        if (delayInMilliseconds > this.maxRetryDelayInMs) {
            delayInMilliseconds = this.maxRetryDelayInMs;
        }
        return delayInMilliseconds;
    }
    connect() {
        this.loxoneAPI.connect();
    }
}
exports.LoxoneConnection = LoxoneConnection;
//# sourceMappingURL=LoxoneConnection.js.map