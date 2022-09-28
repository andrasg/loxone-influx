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
import { RecurringSender } from "./RecurringSender";

var influxStore: InfluxStore = new InfluxStore(config);
var loxoneConnection: LoxoneConnection = new LoxoneConnection(config);
var uuidMappings: any = Utils.readUUIDMappings(config);
var recurringSender: RecurringSender = new RecurringSender(influxStore);

//Logger.setDebug(true);

loxoneConnection.on("update", function (event: LoxoneUpdateEvent) {
    if (event.uuid in uuidMappings) {
        event.mapping = uuidMappings[event.uuid];
        event.src = "ws";

        Logger.log_info("--> IN     " + event.mapping.measurement + ', ' + event.mapping.getTagsAsText() + ', value=' + event.value.toString());
        
        influxStore.sendLoxoneUpdateEventToInflux(event).catch(err => {
            Logger.log_error(`Error saving data to InfluxDB! ${err.stack}`);
        });

        if (event.mapping.intervalSec > 0) {
            recurringSender.set(event);
        }

    } else {
        //Logger.log_debug('Ignoring event value: uuid='+event.uuid+', evt='+Utils.limit_str(event.value.toString(), 100)+'');
    }
});

loxoneConnection.on("authorized", function() {
    Logger.log_info("Authorized event");
});


recurringSender.init();
loxoneConnection.connect();