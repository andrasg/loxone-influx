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
    getdataPointForUuid(uuid) {
        var writeData = JSON.parse(JSON.stringify(this.config.get('uuids')[uuid])); // clone object
        writeData.tags["uuid"] = uuid;
        return writeData;
    }
    sendToInflux(uuid, value, source) {
        var writeData = this.getdataPointForUuid(uuid);
        writeData.tags["src"] = source;
        writeData.fields = { "value": value };
        //log_debug(source + ' - ' + writeData.measurement + ', ' + getTags(writeData.tags) + ', value: ' + value);
        this.db.writePoints([writeData]).catch(err => {
            //log_error(`Error saving data to InfluxDB! ${err.stack}`);
        });
    }
}
exports.InfluxStore = InfluxStore;
//# sourceMappingURL=InfluxStore.js.map