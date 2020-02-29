//
// Original Author: R.A.Rainton <robin@rainton.com>
//
// Simple script to import Loxone stats into Influx DB.
//
// Based on the work of https://github.com/raintonr/loxone-stats-influx 
//
import config = require("config");
config.util.loadFileConfigs('../config');

import { InfluxStore } from "./InfluxStore";
import { LoxoneConnection } from "./LoxoneConnection";
import { Logger } from "./Logger";

var influxStore: InfluxStore = new InfluxStore(config);
var loxoneConnection: LoxoneConnection = new LoxoneConnection(config);

Logger.setDebug(true);

loxoneConnection.on("update", function (uuid, evt) {
    if (uuid in config.get<any[]>('uuids')) {
        Logger.log_info(config.get('uuids')[uuid].measurement + ', ' + getTags(config.get('uuids')[uuid].tags) + ', value=' + limit_str(evt, 100));
        
        //this.influxStore.sendToInflux(uuid, evt, "ws");

    } else {
        Logger.log_debug('Ignoring event value: uuid='+uuid+', evt='+limit_str(evt, 100)+'');
    }
});

loxoneConnection.connect();

/**
 * Limits a string to a max of limit characters and replaces the rest with ...
 * @param text input text
 * @param limit limit to use
 */
function limit_str(text: string, limit: number){
    limit = typeof limit !== 'undefined' ? limit : 100;
    text = ''+text;
    if (text.length <= limit){
        return text;
    }
    return text.substr(0, limit) + '...('+text.length+')';
}

function getTags(tags: any[]) {
    var message = "";
    for (var tag in tags) {
        message += tag.toString() + '=' + tags[tag].toString() + ', ';
    }
    if (message.length > 0) {
        message = message.substring(0, message.length - 2);
    }
    return message;
}