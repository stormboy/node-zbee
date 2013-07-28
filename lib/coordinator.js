var util = require('util');
var Zigbee = require('./zigbee');
var EventEmitter = require('events').EventEmitter;
var ZBee = Zigbee.ZBee;
var Tools = Zigbee.Tools;
var DataStore = require('./store_nedb').DataStore;

/**
 * An XBee HA coordinator
 * 
 * Events sent
 * - nodeAdded
 * - nodeRemoved
 * - nodeUpdated
 * - endpointAdded
 * - endpointRemoved
 * 
 */
var Coordinator = function(options) {
	EventEmitter.call(this);
	this.zbee = new ZBee({port: options.port, baudrate: options.baud, transmit_status_timeout: 8000, max_parallel_messages: 16});
	this.db = new DataStore({ path: options.db_path || (__dirname+'/../data/') });
	this.init();
}

util.inherits(Coordinator, EventEmitter);

/**
 * Configure the XBee for HA Profile
 */
Coordinator.prototype.configure = function() {
	console.log("configuring");
	
	this.zbee._AT("ZS", [0x02] );				// zigbee stack profile
	this.zbee._AT("SC", [0x63, 0x19]);			// scan channel mask
	//this.zbee._AT("SC", [0x1F, 0xFE]);		// scan mask
	//this.zbee._AT("SD", [0x12]);				// scan duration
	
	this.zbee._AT("EE", [0x01], function(err, data) {	// set encryption enabled
	});
	this.zbee._AT("EO", [0x00]);	// encryption options 0x01 - Send the security key unsecured over-the-air during joins, 0x02 - Use trust center
	this.zbee._AT("KY", [
		0x5A, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6C, 0x6C, 0x69, 0x61, 0x6E, 0x63, 0x65, 0x30, 0x39
	]);		// link key: 5A6967426565416C6C69616E63653039
	this.zbee._AT("NK", [0x00]);
	
	//this.zbee._AT("AO", [0x01]);		// AO=1 to allow XBee to pass-on explicit messages
	this.zbee._AT("AO", [0x03]);		// AO=3 to allow XBee to pass-on explicit messages including unhandled ZDO messages

	this.zbee._AT("AC");	// Apply Changes
}

/**
 * Set node ID
 */
Coordinator.prototype.setId = function(id) {
	console.log("setting node ID: " + id);
	this.zbee._AT("NI", id, function(err, data) {
		if (err) {
			console.log("problem setting node ID: " + err);
		}
		else {
			console.log("Node ID set: " + data);
			//this.emit("nodeid", "id");
		}
	});
}

/**
 * get Node ID
 */
Coordinator.prototype.getId = function(cb) {
	console.log("getting node ID");
	this.zbee._AT("NI", function(err, data) {
		if (err) {
			console.log("problem getting node ID: " + err);
			cb.err(err);
		}
		else {
			console.log("Node ID: " + data);
			cb(err, data);		// TODO make data a string
		}
	});
}

Coordinator.prototype.setClusterId = function(id) {
	console.log("setting cluster ID: " + id);
	this.zbee._AT("CI", id, function(err, data) {
		if (err) {
			console.log("problem setting cluster ID: " + err);
		}
		else {
			console.log("Cluster ID set: " + data);
			//this.emit("cluster", "id");
		}
	});
}

/**
 * Save settings
 */
Coordinator.prototype.save = function() {
	var self = this;
	console.log("saving node parameters")
	this.zbee._AT("WR", function(err, data) {
		if (err) {
			console.log("problem saving parameters: " + err);
		}
		else {
			console.log("parameters saved");
			self.emit("saved", "Device parameters saved");
		}
	});
}

/**
 * perform a software reset
 */
Coordinator.prototype.reset= function() {
	var self = this;
	this.zbee._AT("FR", function(err, data) {
		self.emit("reset", "Device reset");
	});
}

/**
 * If no network is associated, the XBee will try to join network when started.
 * Will also try to join a PAN if network config is changed and applied (applied via AC or CN commands).
 */
Coordinator.prototype.join = function() {
	// zbee._AT("CB4", function(err, data) {		// simulate commissioning button press
	// });
}

/**
 * Permit devices to join the network.
 */
Coordinator.prototype.allowJoin = function() {
	this.zbee._AT("CB2", function(err, data) {		// simulate commissioning button press. enables joining for 1 minute
		if (err) {
			console.log("problem allowing joining: " + err);
		}
		else {
			console.log("joing allowed");
		}
	});
}

/**
 * Issue a network-reset to allow the node to leave the network
 */
Coordinator.prototype.leave = function() {
	var self = this;
	// zbee._AT("CB4", function(err, data) {		// simulate commissioning button press
	// });
	this.zbee._AT("NR0", function(err, data) {		// tell the coordinator to leave the network
		if (err) {
			console.log("problem legin the network: " + err);
		}
		else {
			console.log("network left")
			self.emit("leave");
		}
	});
}

Coordinator.prototype.test = function() {
	var data = new Buffer([
		0x34, 0x12, 0x40, 0x40, 0x00, 0xA2, 0x13, 0x00, 0x00, 0x00 //- Required payload for Network Address Request command
	]);
	console.log("sending broadcast");
	this.zbee.broadcast(data, function(err, data) {
		console.log("sent broadcast: " + JSON.stringify(data));
	});
}

Coordinator.prototype.queryAddresses = function () {
	var self = this;
	this.db.getNodes(function(err, nodeDocs) {
		for (var i=0; i<nodeDocs.length; i++) {
			var nodeDoc = nodeDocs[i];
			//console.log("querying node: " + util.inspect(nodeDoc));
			var node = self.zbee.getNode(nodeDoc.address64);
			if (!node) {
				node = self.zbee._createNode(nodeDoc);

				// ping the node so that it is discovered by ZBee.
				node.zdo.requestNetworkAddress(function(err, response) {
					if (err) {
						console.log("error requesting network address: " + util.inspect(err));
					}
					console.log("got network address: " + response.remote16);
				});
			}
		}
	});
}

Coordinator.prototype.at = function(cmd) {
	var arr = cmd.split("=");
	if (arr.length > 0) {
		cmd = arr[0].trim();
	}
	if (arr.length > 1) {
		val = [ new Number(arr[1].trim()) ];
		console.log("sending AT command: " + cmd + " = " + val);
		this.zbee.AT(cmd, val, function(err, data) {		// send AT command
			if (err) {
				console.log("error sending AT command " + cmd + " : " + util.inspect(err));
			}
			else {
				console.log("response from AT command " + cmd + " : " + arrToHex(data));
			}
		});
	}
	else {
		console.log("sending AT command: " + cmd);
		this.zbee.AT(cmd, function(err, data) {		// send AT command
			if (err) {
				console.log("error sending AT command " + cmd + " : " + util.inspect(err));
			}
			else {
				console.log("response from AT command " + cmd + " : " + arrToHex(data));
			}
		});
	}
}

/**
 * Association Indication. Read information regarding last node join request:
	0x00 - Successfully formed or joined a network. (Coordinators form a network, routers
	and end devices join a network.)
	0x21 - Scan found no PANs
	0x22 - Scan found no valid PANs based on current SC and ID settings
	0x23 - Valid Coordinator or Routers found, but they are not allowing joining (NJ expired) 0x24 - No joinable beacons were found
	0x25 - Unexpected state, node should not be attempting to join at this time
	0x27 - Node Joining attempt failed (typically due to incompatible security settings)
	0x2A - Coordinator Start attempt failed
	0x2B - Checking for an existing coordinator
	0x2C - Attempt to leave the network failed
	0xAB - Attempted to join a device that did not respond.
	0xAC - Secure join error - network security key received unsecured
	0xAD - Secure join error - network security key not received
	0xAF - Secure join error - joining device does not have the right preconfigured link key 0xFF - Scanning for a ZigBee network (routers and end devices)
	0xFF - Scanning for a ZigBee network (routers and end devices)
 */
Coordinator.prototype.checkAssociation = function(cb) {
	console.log("checking association")
	this.zbee._AT("AI", function(err, data) {		// // get association information
		if (err) {
			console.log("error checking association: " + err);
		}
		else {
			console.log("got association info: " + data);
		}
		if (typeof cb != 'undefined') {
			cb(err, data);
		}
	});
}

Coordinator.prototype.addBinding = function(binding, cb) {
	var self = this;
	this.db.getNodeByAddress64(binding.sourceAddress.hex, function(err, nodeDoc) {
		if (err) {
			console.log("problem getting node: " + err);
		}
		else {
			var node = self.zbee.getNode(nodeDoc.address64);
			if (!node) {
				console.log("no node: " + nodeDoc.address64);
			}
			else {
				node.zdo.requestBind(binding, function(err, result) {
					console.log("binding result : " +util.inspect(err) + " : " + util.inspect(result));
				});
			}
		}		
	});
}

Coordinator.prototype.activeScan = function() {
	console.log("active scan");
	this.zbee._AT("AI", function(err, data) {		// Association Indication
		if (err) {
			console.log("performing acive scan: " + err);
		}
		else {
			console.log("active scan complete: " + data);
		}
	});
}

/**
 * Applies changes to all command registers causing queued command register values to be applied. 
 * For example, changing the serial interface rate with the BD command will not change the UART 
 * interface rate until changes are applied with the AC command. The CN command and 0x08 API 
 * command frame also apply changes.
 */
Coordinator.prototype.applyChanges = function() {
	this.zbee._AT("AC", function(err, data) {
	});
}

Coordinator.prototype.setEncryptionEnabled = function(val) {
	val = val ? 0x01 : 0x00;
	this.zbee._AT("EE", [val], function(err, data) {
		console.log("encryption set: "  + val);
	})
}

Coordinator.prototype.myDetails = function() {
	this.zbee._AT("MY", function(err, data) {
		console.log("my address: " + JSON.stringify(data));
	})
	this.zbee._AT("MP", function(err, data) {
		console.log("parent address: " + JSON.stringify(data));
	})
	this.zbee._AT("OP", function(err, data) {
		console.log("operating pan: " + JSON.stringify(data));
	})
}

/**
 * Discover nodes on the network
 */
Coordinator.prototype.discover = function() {
	console.log("discovering...");
	this.zbee.discover(); 
}

/**
 * Initialise this
 */
Coordinator.prototype.init = function() {
	var self = this;

	this.zbee.on("error", function(err) {
		console.log("got error from zbee: " + err);
	});
	
	this.zbee.on("initialized", function(params) {
		  console.log("ZBee initialised. Parameters: %s", util.inspect(params));

		// Start Node discovery to find currently connected nodes.
		// self.discover();

		// Local Request:
		self.zbee.AT("VR", function(err, res) {
			console.log("Firmware Version:", self.zbee.tools.bArr2HexStr(res));
		});
	  
	});
	
	this.zbee.on("data", function(data, packet) {
		console.log("--- got zbee data: " + data + " ; packet: " + packet);
	});
	
	this.zbee.on("io", function(sample) {
		console.log("--- got zbee IO: " + sample);
	});
	
	this.zbee.on("disconnect", function() {
		console.log("--- got zbee disconnect");
	});
	
	this.zbee.on("joinedNetwork", function(packet) {
		console.log("--- got zbee joinedNetwork");
	});
	
    this.zbee.on("hardwareReset", function(packet) {
		console.log("--- got zbee hardwareReset");
    });
    
    this.zbee.on("watchdogReset", function(packet) {
		console.log("--- got zbee watchdogReset");
    });
    
    this.zbee.on("disassociated", function(packet) {
		console.log("--- got zbee disassociated");
    });
    
	this.zbee.on("coordinatorStarted", function(packet) {
		console.log("--- got zbee coordinatorStarted");
	});

	this.zbee.on("discoveryEnd", function() {
	  // Discovery is over.
	  console.log("...node discovery over");
	});
	
	this.zbee.on("newNodeDiscovered", function(node) {
		self.emit("node", node);
		
		console.log("Node %s discovered", node.remote64.hex);
		//console.log(util.inspect(node));
		
		// insert or update node info in database
		self.db.persistNode(node);
		
		// listen for endpoints
		node.zdo.on("endpoints", function(data) {
			// endpoints is an buffer of bytes. One byte per endpoint
			//console.log("got node endpoints: " + util.inspect(data));
			handleActiveEndpoints(null, data);
		});
		
		node.zdo.on("application", function(desc) {
			handleApplicationDescriptor(null, desc);
		});
		
		node.on("data", function(data) {
			console.log("--- node data: %s> %s", node.remote64.hex, util.inspect(data)); 
		});

		// node.on("explicit", function(data, packet) {
			// console.log("got explicit");
			// console.log(util.inspect(packet));
// 			
			// if (packet.profileId == 0) {
				// self.zdo.handleRx(packet, data);
			// }
		// });
		
		var handleActiveEndpoints = function(err, data) {
			if (err) {
				console.log("error getting active endpoints: " + util.inspect(err));
			}
			else {
				console.log("got active endpoints for node: " + util.inspect(data));
				//var address16 = data.address16;
				var endpoints = data.endpoints;
				for (var i=0; i<endpoints.length; i++) {
					node.zdo.requestSimpleDescriptor(endpoints[i], handleApplicationDescriptor);
				}
			}
		}
		
		var handleApplicationDescriptor = function(err, desc) {
			if (err) {
				console.log("error getting application desc: " + util.inspect(err));
			}
			else {
				console.log("received application desc: " + util.inspect(desc));
				//var application = node.getApplication(desc.endpoint);
				self.db.persistApplication(desc, function(err, app) {
					self.emit("application", app);
				});

				// TODO remove this test
				// Test On/Off on endpoint 1 of node
				var endpoint = 1;
				setTimeout(function() {
					node.zcl.sendOnOff(endpoint, 1);
				}, 2000);
				setTimeout(function() {
					node.zcl.sendOnOff(endpoint, 0);
				}, 2500);

			}
		}
		//this.zbee.on("endpoints", function(data) {
		//console.log("got endpoints for node: " + Tools.bArr2HexStr(data.address));
		//self.db.getNodeByAddress16(data.address, function(err, nodeDoc) {
//			// store endpoints against node
//			var endpoints = [];
//			for (var i=0; i<data.endpoints.length; i++) {
//				endpoint = { id: endpoints[i] };
//				endoints.push(endpoint);
//				node.zdo.requestSimpleDescriptor(endpoints[i], handleEndpointDescriptor);
//			}
//			nodeDoc.endpoints = endpoints;
		//});
		//
		//});
		
		
		setTimeout(function() {
			node.zdo.requestActiveEndpoints(function(err, data) {
				if (err) {
					handleActiveEndpoints(err, null);
				}
				else {
					// will pick up via event
				}
			});
		}, 500);


/*		
		node.on("route", function(data, packet) {
			console.log("got route: " + data);
			console.log(util.inspect(packet));
			
			var addrs = null;
			node.createSourceRoute(addrs, function(err) {
				if (err) {
					console.log("problem creating source route: " + util.inspect(err));
				}
				else {
					console.log("created source route");
				}
			});
			
		});
*/
	
	});

	this.zbee.init();
	
	this.zbee.on("initialized", function() {
		self.emit("init");
		
//		self.getNodes(function(err, nodeDocs) {
//			//self.emit("init", nodeDocs);
//			
//			for (var i=0; i<nodeDocs.length; i++) {
//				var nodeDoc = nodeDocs[i];
//				var node = self.zbee.getNode(nodeDoc.address);
//				if (!node) {
//					node = self.zbee._createNode(nodeDoc);
//
//					// ping the node so that it is discovered by ZBee.
//					node.zdo.requestNetworkAddress(function(err, response) {
//						if (err) {
//							console.log("error pinging active endpoints: " + util.inspect(err));
//						}
//						else {
//							console.log("got network address: " + response.remote16);
//							// TODO update addresses in db
//							// TODO send node health event to socketio client
//						}
//					});
//				}
//			}
//		});
	});
	
	this.zbee.on("initialized", function() {
		self.db.getApplications(function(err, docs) {
			for (var i=0; i<docs.length; i++) {
				var desc = docs[i];
				console.log("got stored application: " + desc.id);
			}
		});
	});
	
}		// end init()

Coordinator.prototype.getNodes = function(cb) {
	this.db.getNodes(cb);
}

Coordinator.prototype.getApplications = function(cb) {
	this.db.getApplications(cb);
}

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


exports.Coordinator = Coordinator;



function arrToHex(a) {
	var b = a.map(function (x) {
	    x = x + 0xFFFFFFFF + 1;  // twos complement
	    x = x.toString(16); // to hex
	    x = ("00"+x).substr(-2); // zero-pad to 2-digits
	    return x
	}).join(',');
	return b;
}
