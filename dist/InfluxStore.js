"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Influx = require("influx");
const Logger_1 = require("./Logger");
class InfluxStore {
    constructor(config) {
        this.inFlightRequests = 0;
        this.maxInFlightRequests = 3;
        this.config = config;
        this.db = new Influx.InfluxDB(this.config.get('influxdb'));
        this.buffer = new Array();
        this.bufferSize = this.config.get("buffer.bufferSize");
        this.criticalBufferSize = this.config.get("buffer.bufferSize") + this.config.get("buffer.criticalBufferSize");
        let retryIntervalMs = this.config.get('buffer.retryIntervalSec') * 1000;
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (this.buffer.length > 0) {
                Logger_1.Logger.log_info("Trying to recover with " + this.buffer.length + " items in buffer");
                // trigger an error condition test
                let item = this.buffer.pop();
                yield this.sendLoxoneUpdateEventToInfluxInternal(item);
                while (this.buffer.length > 0 && !this.errorPresent) {
                    Logger_1.Logger.log_debug("cycle begins");
                    let inflight = 0;
                    while (this.buffer.length > 0 && !this.errorPresent) {
                        inflight++;
                        if (inflight > 15)
                            break;
                        let item2 = this.buffer.pop();
                        this.sendLoxoneUpdateEventToInfluxInternal(item2);
                    }
                    // wait 1 second, so influx is not overloaded
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                }
                if (this.buffer.length == 0 && !this.errorPresent)
                    Logger_1.Logger.log_info("Buffer successfully flushed");
            }
        }), retryIntervalMs);
    }
    sendLoxoneUpdateEventToInflux(loxoneEvent) {
        if (!this.errorPresent) {
            return this.sendLoxoneUpdateEventToInfluxInternal(loxoneEvent);
        }
        else {
            if (this.bufferSize == 0) {
                Logger_1.Logger.log_error("Buffer off, dropping item");
                return new Promise(() => { });
            }
            if (this.buffer.length >= this.bufferSize) {
                if (this.buffer.length < this.criticalBufferSize && loxoneEvent.mapping.critical) {
                    Logger_1.Logger.log_info("Accepting item into critical buffer");
                }
                else {
                    Logger_1.Logger.log_error("Buffer full, dropping item");
                    return new Promise(() => { });
                }
            }
            this.buffer.push(loxoneEvent);
            Logger_1.Logger.log_debug("ErrorMode is on, adding item to buffer");
            return new Promise(() => { });
        }
    }
    sendLoxoneUpdateEventToInfluxInternal(loxoneEvent) {
        var point = loxoneEvent.asIPoint();
        Logger_1.Logger.log_info("OUT -->   " + loxoneEvent.mapping.measurement + ', ' + loxoneEvent.mapping.getTagsAsText() + ', value=' + loxoneEvent.value.toString());
        return this.db.writePoints([point], {
            database: this.config.get('influxdb.database'),
            precision: 'ms',
        })
            .then(_ => {
            Logger_1.Logger.log_debug("OUT -->");
            if (this.errorPresent)
                this.setErrorPresent(false);
        })
            .catch(reason => {
            Logger_1.Logger.log_error("Cannot send point to Influx");
            if (!this.errorPresent)
                this.setErrorPresent(true);
            this.buffer.push(loxoneEvent);
        });
    }
    setErrorPresent(value) {
        Logger_1.Logger.log_info("Setting errorPresent to: " + value);
        this.errorPresent = value;
    }
}
exports.InfluxStore = InfluxStore;
//# sourceMappingURL=InfluxStore.js.map