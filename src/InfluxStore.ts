import Influx = require('influx');
import { IConfig } from "config";

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

    private getdataPointForUuid(uuid: string):any {
        var writeData = JSON.parse(JSON.stringify(this.config.get('uuids')[uuid])); // clone object
        writeData.tags["uuid"] = uuid;

        return writeData;
    }

    sendToInflux(uuid: string, value: number, source: string):void {
        var writeData = this.getdataPointForUuid(uuid);

        writeData.tags["src"] = source;
        writeData.fields = { "value" : value }

        //log_debug(source + ' - ' + writeData.measurement + ', ' + getTags(writeData.tags) + ', value: ' + value);
        this.db.writePoints([ writeData ]).catch(err => {
            //log_error(`Error saving data to InfluxDB! ${err.stack}`);
        });
    }
}

export { InfluxStore }