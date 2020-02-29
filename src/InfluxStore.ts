import Influx = require('influx');
import { IConfig } from "config";
import { LoxoneUpdateEvent } from './data/LoxoneUpdateEvent';

class InfluxStore {
    private db: Influx.InfluxDB;
    private config: IConfig;

    constructor(config: IConfig) {
        this.config = config;
        this.db = new Influx.InfluxDB({
            host: this.config.get('influxdb.host'),
            database: this.config.get('influxdb.database')
        });   
    }

    sendLoxoneUpdateEventToInflux(loxoneEvent: LoxoneUpdateEvent) {
        var point:Influx.IPoint = loxoneEvent.asIPoint();
        return this.db.writePoints([ point ], {
            database: this.config.get('influxdb.database'),
            precision: 'ms',
          });
    }
}

export { InfluxStore }