var util = require('util')
	, XBee = require('svd-xbee').XBee
	, config = require('../config');



/**
 * Functions:
 * 	- network association
 * 	- binding (device pairing)
 * 
 */
var xbee = new XBee({port: config.port, baudrate: config.baud});

function configure() {
	// key
	xbee._AT("KY", [0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c, 0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39]);
	
	// encryption enabled
	xbee._AT("EE", [0x01], function(err, data) {
	})

	// encryption options 0x01 - Send the security key unsecured over-the-air during joins, 0x02 - Use trust center
	xbee._AT("EO", [0x02], function(err, data) {
	})

	// key
	xbee._AT("SC", [0x63, 0x19]);
	
	// Apply Changes
	xbee._AT("AC", function(err, data) {
	})
}

/**
 * If no network is associated, the XBee will try to join network when started.
 * Will also try to join a PAN if network config is changed and applied (applied via AC or CN commands).
 */
function join() {
	// xbee._AT("CB4", function(err, data) {		// simulate commissioning button press
	// });
}

/**
 * perform a software reset
 */
function reset() {
	xbee._AT("FR", function(err, data) {
	});
}
/**
 * Issue a network-reset to allow the node to leave the network
 */
function leave() {
	xbee._AT("NR0", function(err, data) {		// tell the router to leave the network
	});
}

function allowJoin() {
	xbee._AT("CB2", function(err, data) {		// simulate commissioning button press
	});
}

function test() {
	var data = new String([
		0x34, 0x12, 0x40, 0x40, 0x00, 0xA2, 0x13, 0x00, 0x00, 0x00 //- Required payload for Network Address Request command
	]);
	xbee.broadcast(data, function(err, data) {
		console.log("sent broadcast: " + JSON.stringify(data));
	});
}

/**
 * Association Indication. Read information regarding last node join request:
	0x00 - Successfully formed or joined a network. (Coordinators form a network, routers
	and end devices join a network.)
	0x21 - Scan found no PANs
	0x22 - Scan found no valid PANs based on current SC and ID settings
	0x23 - Valid Coordinator or Routers found, but they are not allowing joining (NJ expired) 0x24 - No joinable beacons were found
	0x25 - Unexpected state, node should not be attempting to join at this time
	0x27 - Node Joining attempt failed (typically due to incompatible security settings)
	0x2A - Coordinator Start attempt failed‘
	0x2B - Checking for an existing coordinator
	0x2C - Attempt to leave the network failed
	0xAB - Attempted to join a device that did not respond.
	0xAC - Secure join error - network security key received unsecured
	0xAD - Secure join error - network security key not received
	0xAF - Secure join error - joining device does not have the right preconfigured link key 0xFF - Scanning for a ZigBee network (routers and end devices)
 */
function getAssociation(callback) {
	xbee._AT("AI", function(err, data) {		// simulate commissioning button press
		callback(err, data);
	});
}

/**
 * Applies changes to all command registers causing queued command register values to be applied. 
 * For example, changing the serial interface rate with the BD command will not change the UART 
 * interface rate until changes are applied with the AC command. The CN command and 0x08 API 
 * command frame also apply changes.
 */
function applyChanges() {
	xbee._AT("AC", function(err, data) {
	});
}

function setEncryptionEnabled(val) {
	val = val ? 0x01 : 0x00;
	xbee._AT("EE", [val], function(err, data) {
		console.log("encryption set: "  + val);
	})
}

function myDetails() {
	xbee._AT("MY", function(err, data) {
		console.log("my address: " + JSON.stringify(data));
	})
	xbee._AT("MP", function(err, data) {
		console.log("parent address: " + JSON.stringify(data));
	})
	xbee._AT("OP", function(err, data) {
		console.log("operating pan: " + JSON.stringify(data));
	})
}

xbee.on("configured", function(config) {
	console.log("XBee Config: %s", util.inspect(config));

	// var apiOptions = 0x03;
	// xbee._AT("AO", [apiOptions], function(err, data) {
		// console.log("set API Options: "  + apiOptions);
	// });
	
/*	
	xbee._AT("KY", [0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c, 0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39]);
	
	// encryption enabled
	xbee._AT("EE", [0x00], function(err, data) {
		console.log("response from EE: "  + JSON.stringify(data));
	})

	// exncryption options 0x01 - Send the security key unsecured over-the-air during joins, 0x02 - Use trust center
	xbee._AT("EO", function(err, data) {
		// should be 2 (or 0?)
		console.log("response from EO: "  + JSON.stringify(data));
	})
	*/
	// 0x3F, 0xFE
	// xbee._AT("SC", [0x63, 0x19], function(err, data) {
		// console.log("response from SC: "  + JSON.stringify(data));
	// })
	
	/*
		var interval = setInterval(function() {
			xbee._AT("AI", function(err, data) {
				console.log("got AI: "  + JSON.stringify(data));
				if (data.commandData[0] == 0) {
					clearInterval(interval);
					// has joined zigbee network
					myDetails();
					
					console.log("discovering");
					xbee.discover();
				}
				else {
					// join();
				}
			});
		}, 5000);
	*/	
	
});

xbee.on("node", function(node) {
	console.log("Node %s connected", node.id);
	
	node.on("data", function(data) {
		//node.send("pong");
		console.log("%s: %s", node.id, util.inspect(data));
	});
	
	if (node.id == "NODE1") {
		function schedulePatterns() {
			setTimeout(function() {
					console.log("sending D0 - 0x05 to node1");
					node._AT('D0', [0x05]);
				}, 1000);
			setTimeout(function() {
				console.log("sending D0 - 0x02 to node1");
				node._AT('D0', [0x02]);
				}, 4000);
	
			setTimeout(function() {
				console.log("sending D1 - 0x05 to node1");
				node._AT('D1', [0x05]);
				}, 2000);
			setTimeout(function() {
				console.log("sending D1 - 0x02 to node1");
				node._AT('D1', [0x02]);
				}, 5000);
		}
	
		setInterval(schedulePatterns, 10000);
	}

});

xbee.init();


var readline = require('readline');
	
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var running = true;

function prompt() {
	if(running) {
		rl.question("> ", function(answer) {
			try {
				switch(answer) {
					case "init":
						xbee.init();
					case "config":
						configure();
						break;
					case "quit":
						running = false;
						break;
					case "join":
						join();
						break;
					case "leave":
						leave();
						break;
					case "discover":
						xbee.discover();
						break;
					case "test":
						test();
						break;
					default:
						if (answer.indexOf("AT") == 0) {
							var s = answer.split(" ");
							var command = s[0].substring(2);
							var val = undefined;
							if (s.length > 1) {
								val = [ Number(s[1]) ];
							}
							xbee._AT(command, val, function(err, data) {
								console.log("response from AT command: " + JSON.stringify(data));
							});
						}
				}
				console.log(":", answer);
			}
			catch (e) {
				console.log("error: " + e);
			}
			setTimeout(prompt, 10);
		});
	}
	else {
		rl.close();
	}
}

prompt();


/*
 * Modem Status
 
	0 = Hardware reset
	1 = Watchdog timer reset
	2 =Joined network (routers and end devices)
	3 =Disassociated
	6 =Coordinator started
	7 = Network security key was updated
	0x0D = Voltage supply limit exceeded (PRO S2B only) 0x11 = Modem configuration changed while join in progress
	0x80+ = stack error
 */
ModemStatus = {}
ModemStatus[0] = "Hardware reset";
ModemStatus[1] = "Watchdog timer reset";
ModemStatus[2] = "Joined network (routers and end devices)";
ModemStatus[3] = "Disassociated";
ModemStatus[6] = "Coordinator started";
ModemStatus[7] = "Network security key was updated";
ModemStatus[0x0D] = "Voltage supply limit exceeded";
ModemStatus[0x11] = "Modem configuration changed while join in progress";
