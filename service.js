var Service = require('node-windows').Service;
var EventLogger = require('node-windows').EventLogger;

// Create a new service object
var svc = new Service({
    name:'LoxoneToInflux',
    description: 'Sends data from Loxone to Influx',
    script: 'C:\\LoxoneToInflux\\loxone-ws-influx.js'
});

var log = new EventLogger('LoxoneToInflux');

svc.on('install',function(){
  svc.start();
});

svc.on('start',function(){
    console.log(svc.name+' started!');
    log.info(svc.name+' started!');
});

svc.on('stop',function(){
    console.log(svc.name+' stopped!');
    log.info(svc.name+' stopped!');
  });

svc.on('error',function(){
    console.log(svc.name+' error!');
    log.error(svc.name+' error!');
});

// Install the script as a service.
svc.install();
console.log(svc.name+' installed!');
