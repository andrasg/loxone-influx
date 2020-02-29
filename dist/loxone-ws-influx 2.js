"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//
// Original Author: R.A.Rainton <robin@rainton.com>
//
// Simple script to import Loxone stats into Influx DB.
//
// Based on the work of https://github.com/raintonr/loxone-stats-influx 
//
const config = require("config");
config.util.loadFileConfigs('../config');
const LoxoneAPI = require("node-lox-ws-api");
const Influx = require("influx");
var lox = new LoxoneAPI(config.get('loxone.host'), config.get('loxone.username'), config.get('loxone.password'), true, 'AES-256-CBC' /*'Hash'*/);
const influxdb = new Influx.InfluxDB({
    host: config.get('influxdb.host'),
    database: config.get('influxdb.database')
});
var debug = false;
var interval;
var retryCount = 0;
var configfile = "./config/default.json";
const maxRetryDelayInMs = config.get('intervals.maxRetryDelayInSec') * 1000;
const periodicSendIntervalInMs = config.get('intervals.periodicSendIntervalInSec') * 1000;
var objectTracker = {};
function log_error(message) {
    console.log((new Date().toISOString()) + ' ERROR : ' + message);
}
function log_info(message) {
    console.log((new Date().toISOString()) + ' INFO : ' + message);
}
function log_debug(message) {
    if (debug) {
        console.log((new Date().toISOString()) + ' DEBUG: ' + message);
    }
}
/**
 * Limits a string to a max of limit characters and replaces the rest with ...
 * @param text input text
 * @param limit limit to use
 */
function limit_str(text, limit) {
    limit = typeof limit !== 'undefined' ? limit : 100;
    text = '' + text;
    if (text.length <= limit) {
        return text;
    }
    return text.substr(0, limit) + '...(' + text.length + ')';
}
function getExponentialFallbackDelay(retryCount) {
    var delayInMilliseconds = 0.5 * (Math.pow(2, retryCount) - 1) * 1000;
    if (delayInMilliseconds > maxRetryDelayInMs) {
        delayInMilliseconds = maxRetryDelayInMs;
    }
    return delayInMilliseconds;
}
function retryConnect() {
    retryCount++;
    var delayInMilliseconds = getExponentialFallbackDelay(retryCount);
    log_info('Sleeping for ' + delayInMilliseconds + ' milliseconds before retrying...' + retryCount);
    setTimeout(function () { lox.connect(); }, delayInMilliseconds);
}
function getTags(tags) {
    var message = "";
    for (var tag in tags) {
        message += tag.toString() + '=' + tags[tag].toString() + ', ';
    }
    if (message.length > 0) {
        message = message.substring(0, message.length - 2);
    }
    return message;
}
function sendOldValues() {
    for (var uuid in objectTracker) {
        var interval = periodicSendIntervalInMs;
        if (objectTracker[uuid].config.intervalSec !== undefined) {
            interval = objectTracker[uuid].config.intervalSec * 1000;
            // do not send old values when interval = 0
            if (interval == 0)
                continue;
        }
        if (objectTracker[uuid].lastSeen + interval < Date.now()) {
            objectTracker[uuid].lastSeen = Date.now();
            sendToInflux(uuid, objectTracker[uuid].lastValue, "old");
        }
    }
}
function updateTracker(uuid, value) {
    if (objectTracker[uuid] === undefined) {
        objectTracker[uuid] = {};
        objectTracker[uuid].config = config.get('uuids')[uuid];
    }
    objectTracker[uuid].lastSeen = Date.now();
    objectTracker[uuid].lastValue = value;
}
function sendToInflux(uuid, value, source) {
    var writeData = JSON.parse(JSON.stringify(config.get('uuids')[uuid])); // clone object
    writeData.tags["uuid"] = uuid;
    writeData.tags["src"] = source;
    writeData.fields = { "value": value };
    log_debug(source + ' - ' + writeData.measurement + ', ' + getTags(writeData.tags) + ', value: ' + value);
    influxdb.writePoints([writeData]).catch(err => {
        log_error(`Error saving data to InfluxDB! ${err.stack}`);
    });
}
lox.on('connect', function () {
    log_info("Loxone connected!");
});
lox.on('close', function () {
    clearInterval(interval);
    log_info("Loxone closed!");
});
lox.on('abort', function () {
    log_info("Loxone aborted!");
    process.exit();
});
lox.on('close_failed', function () {
    log_info("Loxone close failed!");
    process.exit();
});
lox.on('connect_failed', function (error) {
    log_info('Loxone connect failed!');
});
lox.on('connection_error', function (error) {
    clearInterval(interval);
    if (error != undefined) {
        log_info('Loxone connection error: ' + error.toString());
    }
    else {
        log_info('Loxone connection error');
    }
    retryConnect();
});
lox.on('auth_failed', function (error) {
    log_info('Loxone auth error: ' + JSON.stringify(error));
});
lox.on('authorized', function () {
    retryCount = 0;
    log_info('Loxone authorized');
    setTimeout(function () { lox.send_command('jdev/cfg/version'); }, 5000);
    interval = setInterval(function () { sendOldValues(); }, 10000);
});
lox.on('update_event_value', function (uuid, evt) {
    if (uuid in config.get('uuids')) {
        log_info(config.get('uuids')[uuid].measurement + ', ' + getTags(config.get('uuids')[uuid].tags) + ', value=' + limit_str(evt, 100));
        updateTracker(uuid, evt);
        sendToInflux(uuid, evt, "ws");
    }
    else {
        log_debug('Ignoring event value: uuid=' + uuid + ', evt=' + limit_str(evt, 100) + '');
    }
});
process.on('SIGINT', function () {
    lox.abort();
});
/*
// wire up config auto reload
if (config.get<boolean>('autoreloaduuids')) {
    log_info("Startring to watch for changes in '" + configfile + "'")
    fs.watchFile(configfile, (curr, prev) => {
        log_info("Config file changed, reloading config");

        delete require.cache[require.resolve('config')];
        config = require('config');

        log_info("Done reloading config");
    });
}*/
lox.connect();
//# sourceMappingURL=loxone-ws-influx 2.js.map