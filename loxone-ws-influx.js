//
// Original Author: R.A.Rainton <robin@rainton.com>
//
// Simple script to import Loxone stats into Influx DB.
//
// Most of this is shamelessly copied from Alladdin's test harness:
// https://github.com/alladdin/node-lox-ws-api-testing
//
// Config file is JSON format, something like...
// Get the Loxone UUIDs from the stat filenames, web interface, etc.
// 
//{
//	"loxone" : {
//		"host": "your.loxone.miniserver",
//		"username": "someusername",
//		"password": "somepasword"
//	},
//	
//	"influxdb" : {
//		"host": "your.influxdb.host",
//		"database": "yourdb"
//	},
//	
//	"uuids" : {
//		"1234abcd-037d-9763-ffffffee1234abcd": {"measurement": "temperature", "tags": {"room": "Kitchen"} },
//		"1234abcd-005f-8965-ffffffee1234abcd": {"measurement": "humidity", "tags": {"room": "Kitchen"} },
//		"1234abcd-0052-0f08-ffffffee1234abcd": {"measurement": "AnythingYouLike", "tags": {"lots": "OfTags", "AsMany": "AsYouLike"} }
//	}
//}
//
// This code automatically adds the tags, 'uuid' and 'src' to all values.
//

const config = require("config");

var LoxoneAPI = require('node-lox-ws-api');
var lox = new LoxoneAPI(config.loxone.host, config.loxone.username, config.loxone.password, true, 'AES-256-CBC' /*'Hash'*/);

const Influx = require('influx');
const influxdb = new Influx.InfluxDB({
	host: config.influxdb.host,
	database: config.influxdb.database
});

var debug = false;
var interval;
var retryCount = 0;
const maxRetryDelayInMs = config.intervals.maxRetryDelayInSec * 1000;
const periodicSendIntervalInMs = config.intervals.periodicSendIntervalInSec * 1000;
var objectTracker = { };

function log_error(message) {
    console.log((new Date().toISOString())+' ERROR : '+message);
}

function log_info(message) {
    console.log((new Date().toISOString())+' INFO : '+message);
}

function log_debug(message) {
    if (debug){
        console.log((new Date().toISOString())+' DEBUG: '+message);
    }
}

function limit_str(text, limit){
    limit = typeof limit !== 'undefined' ? limit : 100;
    text = ''+text;
    if (text.length <= limit){
        return text;
    }
    return text.substr(0, limit) + '...('+text.length+')';
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
    for(var uuid in objectTracker) {
        var interval = periodicSendIntervalInMs;
        if (objectTracker[uuid].config.intervalSec !== undefined) {
            interval = objectTracker[uuid].config.intervalSec * 1000;
            
            // do not send old values when interval = 0
            if (interval == 0) continue;
        }
        if (objectTracker[uuid].lastSeen + interval < Date.now()) {
            objectTracker[uuid].lastSeen = Date.now();
            sendToInflux(uuid, objectTracker[uuid].lastValue, "old");
        }
    }
}

function updateTracker(uuid, value) {
    if (objectTracker[uuid] === undefined) {
        objectTracker[uuid] = { };
        objectTracker[uuid].config = config.uuids[uuid];
    }
    
    objectTracker[uuid].lastSeen = Date.now();
    objectTracker[uuid].lastValue = value;
}

function sendToInflux(uuid, value, source) {
    var writeData = JSON.parse(JSON.stringify(config.uuids[uuid])); // clone object
    writeData.tags["uuid"] = uuid;
    writeData.tags["src"] = source;
    writeData.fields = { "value" : value }
    log_debug(source + ' - ' + writeData.measurement + ', ' + getTags(writeData.tags) + ', value: ' + value);
    influxdb.writePoints([ writeData ]).catch(err => {
    	log_error(`Error saving data to InfluxDB! ${err.stack}`)
    });
}

lox.on('connect', function() {
    log_info("Loxone connected!");
});

lox.on('close', function() {
    clearInterval(interval);
    log_info("Loxone closed!");
});

lox.on('abort', function() {
    log_info("Loxone aborted!");
    process.exit();
});

lox.on('close_failed', function() {
    log_info("Loxone close failed!");
    process.exit();
});

lox.on('connect_failed', function(error) {
    log_info('Loxone connect failed!');
});

lox.on('connection_error', function(error) {
    clearInterval(interval);
    if (error != undefined) {
        log_info('Loxone connection error: ' + error.toString());
    }
    else {
        log_info('Loxone connection error');
    }
    retryConnect();
});

lox.on('auth_failed', function(error) {
    log_info('Loxone auth error: ' + JSON.stringify(error));
});

lox.on('authorized', function() {
    retryCount = 0;
    log_info('Loxone authorized');
    setTimeout(function() { lox.send_command('jdev/cfg/version') }, 5000);
    interval = setInterval(function() { sendOldValues() }, 10000);
});

lox.on('update_event_value', function(uuid, evt) {
    if (uuid in config.uuids) {
		log_info(config.uuids[uuid].measurement + ', ' + getTags(config.uuids[uuid].tags) + ', value=' + limit_str(evt, 100));
        
        updateTracker(uuid, evt);
        sendToInflux(uuid, evt, "ws");

	} else {
		log_debug('Ignoring event value: uuid='+uuid+', evt='+limit_str(evt, 100)+'');
	}
});

process.on('SIGINT', function () {
    lox.abort();
});

lox.connect();
