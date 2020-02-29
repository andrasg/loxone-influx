"use strict";
//
// Original Author: R.A.Rainton <robin@rainton.com>
// Initially based on the work of https://github.com/raintonr/loxone-stats-influx 
//
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const InfluxStore_1 = require("./InfluxStore");
const LoxoneConnection_1 = require("./LoxoneConnection");
const Logger_1 = require("./Logger");
const Utils_1 = require("./Utils");
var influxStore = new InfluxStore_1.InfluxStore(config);
var loxoneConnection = new LoxoneConnection_1.LoxoneConnection(config);
var uuidMappings = Utils_1.Utils.readUUIDMappings(config);
var configfile = './config/default.json';
//Logger.setDebug(true);
loxoneConnection.on("update", function (event) {
    if (event.uuid in uuidMappings) {
        event.mapping = uuidMappings[event.uuid];
        Logger_1.Logger.log_info(event.mapping.measurement + ', ' + event.mapping.getTagsAsText() + ', value=' + event.value.toString());
        influxStore.sendLoxoneUpdateEventToInflux(event).catch(err => {
            Logger_1.Logger.log_error(`Error saving data to InfluxDB! ${err.stack}`);
        });
    }
    else {
        Logger_1.Logger.log_debug('Ignoring event value: uuid=' + event.uuid + ', evt=' + Utils_1.Utils.limit_str(event.value.toString(), 100) + '');
    }
});
loxoneConnection.connect();
//# sourceMappingURL=loxone-ws-influx.js.map