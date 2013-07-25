var config = require("../config.json");
var util = require('util');
var XBee = require('svd-xbee').XBee;

// Replace with your xbee's UART location and correct baud rate (if you omit baudrate, the code assumes your xbee talks at 57600).
var xbee = new XBee({port: config.port, baudrate:9600});

xbee.on("configured", function(config) {
  console.log("XBee Config: %s", util.inspect(config));
});

xbee.on("node", function(node) {
  console.log("Node %s connected", node.id);

  node.on("data", function(data) {
    console.log("%s: %s", node.id, util.inspect(data));
  });

});


xbee.init();
