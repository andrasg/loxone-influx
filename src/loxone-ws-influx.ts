//
// Author: Andras Gaal <andras@gaal.eu>
// Original Author: R.A.Rainton <robin@rainton.com>
// Initially based on the work of https://github.com/raintonr/loxone-stats-influx 
//

import config = require("config");

import { InfluxStore } from "./InfluxStore";
import { LoxoneConnection } from "./LoxoneConnection";
import { Logger } from "./Logger";
import { LoxoneUpdateEvent } from "./data/LoxoneUpdateEvent";
import { Utils } from "./Utils";

var influxStore: InfluxStore = new InfluxStore(config);
var loxoneConnection: LoxoneConnection = new LoxoneConnection(config);
var uuidMappings: any = Utils.readUUIDMappings(config);
var configfile = './config/default.json'

//Logger.setDebug(true);

loxoneConnection.on("update", function (event: LoxoneUpdateEvent) {
    if (event.uuid in uuidMappings) {
        event.mapping = uuidMappings[event.uuid];
        Logger.log_info("--> IN " + event.mapping.measurement + ', ' + event.mapping.getTagsAsText() + ', value=' + event.value.toString());
        
        influxStore.sendLoxoneUpdateEventToInflux(event).catch(err => {
            Logger.log_error(`Error saving data to InfluxDB! ${err.stack}`);
        });

    } else {
        //Logger.log_debug('Ignoring event value: uuid='+event.uuid+', evt='+Utils.limit_str(event.value.toString(), 100)+'');
    }
});

loxoneConnection.connect();