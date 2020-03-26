import { IConfig } from "config";
import LoxoneAPI = require('node-lox-ws-api');
import { Logger } from "./Logger";
import { EventEmitter } from "events";
import { emit } from "cluster";
import { LoxoneUpdateEvent } from "./data/LoxoneUpdateEvent";

class LoxoneConnection extends EventEmitter {

    private config: IConfig;
    private loxoneAPI: any;
    private retryCount: number;
    private maxRetryDelayInMs: number;

    constructor(config: IConfig) {
        super();
        this.config = config;
        let host = config.get('loxone.host');
        let user = config.get('loxone.username');
        let password = config.get('loxone.password');
        this.loxoneAPI = new LoxoneAPI(host, user, password, true, 'AES-256-CBC' /*'Hash'*/);
        this.maxRetryDelayInMs = config.get<number>('loxone.maxRetryDelayInSec') * 1000;

        this.setupEvents();
    }

    private setupEvents() {
        var that = this;

        this.loxoneAPI.on('connect', function() {
            Logger.log_info("Loxone connected!");
        });

        this.loxoneAPI.on('close', function() {
            that.emit("close");
            Logger.log_info("Loxone closed!");
        });
        
        this.loxoneAPI.on('abort', function() {
            Logger.log_info("Loxone aborted!");
            process.exit();
        });
        
        this.loxoneAPI.on('close_failed', function() {
            Logger.log_info("Loxone close failed!");
            process.exit();
        });
        
        this.loxoneAPI.on('connect_failed', function(error) {
            Logger.log_info('Loxone connect failed!');
        });
        
        this.loxoneAPI.on('connection_error', function(error) {
            emit("connection_error");
            if (error != undefined) {
                Logger.log_info('Loxone connection error: ' + error.toString());
            }
            else {
                Logger.log_info('Loxone connection error');
            }
            that.retryConnect();    
        });
        
        this.loxoneAPI.on('auth_failed', function(error) {
            Logger.log_info('Loxone auth error: ' + JSON.stringify(error));
        });
        
        this.loxoneAPI.on('authorized', function() {
            emit("authorized");
            that.retryCount = 0;
            Logger.log_info('Loxone authorized');
            setTimeout(function() { that.loxoneAPI.send_command('jdev/cfg/version') }, 5000);    
        });
        
        this.loxoneAPI.on('update_event_value', function(uuid, evt) {
            that.emit("update", new LoxoneUpdateEvent(uuid, evt));
        });
        
        process.on('SIGINT', function () {
            that.loxoneAPI.abort();
        });
    }

    private retryConnect() {
        if (this.retryCount < 10) {
            this.retryCount++;
        }
        
        var delayInMilliseconds = this.getExponentialFallbackDelay(this.retryCount);
        Logger.log_info('Sleeping for ' + delayInMilliseconds + ' milliseconds before retrying...' + this.retryCount);
        setTimeout(function () { this.loxoneAPI.connect(); }, delayInMilliseconds);
    }

    private getExponentialFallbackDelay(retryCount: number): number {
        var delayInMilliseconds = 0.5 * Math.pow(2, retryCount) * 1000;
        if (delayInMilliseconds > this.maxRetryDelayInMs) {
            delayInMilliseconds = this.maxRetryDelayInMs;
        }
    
        return delayInMilliseconds;
    }

    connect() {
        this.loxoneAPI.connect();
    }
}

export { LoxoneConnection }