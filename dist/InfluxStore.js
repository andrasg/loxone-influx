"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Influx = require("influx");
class InfluxStore {
    constructor(config) {
        this.config = config;
        this.db = new Influx.InfluxDB({
            host: this.config.get('influxdb.host'),
            database: this.config.get('influxdb.database')
        });
    }
    sendLoxoneUpdateEventToInflux(loxoneEvent) {
        var point = loxoneEvent.asIPoint();
        return this.db.writePoints([point], {
            database: this.config.get('influxdb.database'),
            precision: 'ms',
        });
    }
}
exports.InfluxStore = InfluxStore;
//# sourceMappingURL=InfluxStore.js.map