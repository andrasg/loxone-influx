"use strict";
//
// Author: Andras Gaal <andras@gaal.eu>
// Original Author: R.A.Rainton <robin@rainton.com>
// Initially based on the work of https://github.com/raintonr/loxone-stats-influx 
//
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const InfluxStore_1 = require("./InfluxStore");
const LoxoneConnection_1 = require("./LoxoneConnection");
const Logger_1 = require("./Logger");
const Utils_1 = require("./Utils");
const RecurringSender_1 = require("./RecurringSender");
var influxStore = new InfluxStore_1.InfluxStore(config);
var loxoneConnection = new LoxoneConnection_1.LoxoneConnection(config);
var uuidMappings = Utils_1.Utils.readUUIDMappings(config);
var recurringSender = new RecurringSender_1.RecurringSender(influxStore);
//Logger.setDebug(true);
loxoneConnection.on("update", function (event) {
    if (event.uuid in uuidMappings) {
        event.mapping = uuidMappings[event.uuid];
        event.src = "ws";
        Logger_1.Logger.log_info("--> IN     " + event.mapping.measurement + ', ' + event.mapping.getTagsAsText() + ', value=' + event.value.toString());
        influxStore.sendLoxoneUpdateEventToInflux(event).catch(err => {
            Logger_1.Logger.log_error(`Error saving data to InfluxDB! ${err.stack}`);
        });
        if (event.mapping.intervalSec > 0) {
            recurringSender.set(event);
        }
    }
    else {
        //Logger.log_debug('Ignoring event value: uuid='+event.uuid+', evt='+Utils.limit_str(event.value.toString(), 100)+'');
    }
});
loxoneConnection.on("authorized", function () {
    Logger_1.Logger.log_info("Authorized event");
});
recurringSender.init();
loxoneConnection.connect();
//# sourceMappingURL=loxone-ws-influx.js.map