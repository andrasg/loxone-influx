import Influx = require('influx');
import { IConfig } from "config";
import { LoxoneUpdateEvent } from './data/LoxoneUpdateEvent';
import { Logger } from './Logger';

class InfluxStore {
    private db: Influx.InfluxDB;
    private config: IConfig;
    private buffer: Array<LoxoneUpdateEvent>; 
    private errorPresent: boolean;
    private inFlightRequests: number = 0;
    private maxInFlightRequests: number = 3;
    private bufferSize: number;
    private criticalBufferSize: number;

    constructor(config: IConfig) {
        this.config = config;
        this.db = new Influx.InfluxDB(this.config.get('influxdb'));   
        this.buffer = new Array<LoxoneUpdateEvent>();
        this.bufferSize = this.config.get<number>("buffer.bufferSize");
        this.criticalBufferSize = this.config.get<number>("buffer.bufferSize") + this.config.get<number>("buffer.criticalBufferSize")
        let retryIntervalMs = this.config.get<number>('buffer.retryIntervalSec') * 1000;

        setInterval(async () => {
            if (this.buffer.length > 0) {
                Logger.log_info("Trying to recover with " + this.buffer.length + " items in buffer");

                // trigger an error condition test
                let item = this.buffer.pop();
                await this.sendLoxoneUpdateEventToInfluxInternal(item);

                while (this.buffer.length > 0 && !this.errorPresent) {
                    Logger.log_debug("cycle begins");
                    let inflight = 0;
                    while (this.buffer.length > 0 && !this.errorPresent) {
                        inflight++;
                        if (inflight > 15)  break;
                        let item2 = this.buffer.pop();
                        this.sendLoxoneUpdateEventToInfluxInternal(item2);
                    }
                    // wait 1 second, so influx is not overloaded
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                if (this.buffer.length == 0 && !this.errorPresent)
                    Logger.log_info("Buffer successfully flushed")
            }
        }, retryIntervalMs);
    }

    sendLoxoneUpdateEventToInflux(loxoneEvent: LoxoneUpdateEvent) {
        if (!this.errorPresent) {
            return this.sendLoxoneUpdateEventToInfluxInternal(loxoneEvent);
        } else {
            if (this.bufferSize == 0) {
                Logger.log_error("Buffer off, dropping item");
                return new Promise<void>(() => {});
            }
            if (this.buffer.length >= this.bufferSize) {
                if (this.buffer.length < this.criticalBufferSize && loxoneEvent.mapping.critical) {
                    Logger.log_info("Accepting item into critical buffer");
                } else {
                    Logger.log_error("Buffer full, dropping item");
                    return new Promise<void>(() => {});
                }
            }
            this.buffer.push(loxoneEvent);
            Logger.log_debug("ErrorMode is on, adding item to buffer")
            return new Promise<void>(() => {});
        }
    }

    private sendLoxoneUpdateEventToInfluxInternal(loxoneEvent: LoxoneUpdateEvent): Promise<void> {
        var point:Influx.IPoint = loxoneEvent.asIPoint();

        Logger.log_info("OUT -->    " + loxoneEvent.mapping.measurement + ', ' + loxoneEvent.mapping.getTagsAsText() + ', value=' + loxoneEvent.value.toString());

        return this.db.writePoints([ point ], {
                database: this.config.get('influxdb.database'),
                precision: 'ms',
            })
            .then(_ => {
                Logger.log_debug("OUT -->    (success)")
                if (this.errorPresent) this.setErrorPresent(false);
            })
            .catch(reason => {
                Logger.log_error("Cannot send point to Influx: " + reason);
                if (!this.errorPresent) this.setErrorPresent(true);
                this.buffer.push(loxoneEvent);
            })
    }

    private setErrorPresent(value: boolean) {
        Logger.log_info("Setting errorPresent to: " + value);
        this.errorPresent = value;
    }
}

export { InfluxStore }