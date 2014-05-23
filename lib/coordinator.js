var util = require('util');
var Zigbee = require('./zbee');
var EventEmitter = require('events').EventEmitter;
var ZBee = Zigbee.ZBee;
var Tools = Zigbee.Tools;
var DataStore = require('./store/store_nedb').DataStore;

var DEBUG = false;

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
var Coordinator = exports.Coordinator = function(options) {
	EventEmitter.call(this);
	this.zbee = new ZBee({
		port: options.port, 
		baudrate: options.baud, 
		transmit_status_timeout: 8000, 
		max_parallel_messages: 16
	});
	this.db = new DataStore({ 
		'path':      options.db_path || (__dirname+'/../data/'),
		'transient': options.db_transient 
	});
	this.init();
}

util.inherits(Coordinator, EventEmitter);


/* -------------------- XBee functions ----------------------------- */
/**
 * Configure the XBee for HA Profile
 */
Coordinator.prototype.configure = function() {
	console.log("configuring");
	this.zbee.configure();
}


/**
 * Save XBee settings
 */
Coordinator.prototype.save = function() {
	console.log("saving node parameters")
	this.zbee.save();
}

/**
 * perform a software reset
 */
Coordinator.prototype.reset = function() {
	this.zbee.reset();
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

Coordinator.prototype.checkAssociation = function(cb) {
	console.log("checking association")
	this.zbee.checkAssociation(cb);
}


/* ------------------------------------------------------------------ */


Coordinator.prototype.test = function() {
	var data = new Buffer([
		0x34, 0x12, 0x40, 0x40, 0x00, 0xA2, 0x13, 0x00, 0x00, 0x00 //- Required payload for Network Address Request command
	]);
	console.log("sending broadcast");
	this.zbee.broadcast(data, function(err, data) {
		console.log("sent broadcast: " + JSON.stringify(data));
	});
}


/**
 * If no network is associated, the XBee will try to join network when started.
 * Will also try to join a PAN if network config is changed and applied (applied via AC or CN commands).
 */
Coordinator.prototype.joinNetwork = function() {
	this.zbee.joinNetwork();
}

/**
 * Permit devices to join the network.
 */
Coordinator.prototype.allowJoin = function() {
	this.zbee.allowJoin();
}

/**
 * Issue a network-reset to allow the node to leave the network
 */
Coordinator.prototype.leaveNetwork = function() {
	this.zbee.loeaveNetwork();
}

/**
 * Request the NetworkAddress of each previously known node identified by its 64bit Extended Address.
 */
Coordinator.prototype.queryAddresses = function () {
	var self = this;
	
	// get network address of local XBee node.
//	this.zbee.localNode.zdo.requestNetworkAddress(0x01, function(err, response) {
//		if (err) {
//			console.log("error requesting network address: " + util.inspect(err));
//		}
//		console.log("got network address: " + JSON.stringify(response));
//	});
	
	this.getStoredNodes(function(err, nodeDocs) {
		for (var i=0; i<nodeDocs.length; i++) {
			var nodeDoc = nodeDocs[i];
			console.log("querying node: " + nodeDoc.address64);
			var node = self.zbee.getNode(nodeDoc.address64);
			if (!node) {
				node = self.zbee._createNode(nodeDoc);
			}
			// ping the node so that it is discovered by ZBee.
			node.zdo.requestNetworkAddress(function(err, response) {
				if (err) {
					console.log("error requesting network address: " + util.inspect(err));
				}
				console.log("got network address: " + JSON.stringify(response));
			});
		}
	});
}

Coordinator.prototype.discoverNodeEndpoints = function(address64, cb) {
	var node = this.zbee.getNode(address64);
	if (!node) {
		console.log("could not get node: " + address64);
	}
	else {
		var self = this;
		node.zdo.requestActiveEndpoints(function(err, data) {
			if (err) {
				self._handleActiveEndpoints(err, node, null);
			}
			else {
				// will pick up via event
			}
		});
	}
}

/**
 * Make a Zigbee Device identify itself.  Usually by flashing a light.
 */
Coordinator.prototype.identifyDevice = function(address64, endpoint, cb) {
	var self = this;
	this.db.getNodeByAddress64(address64, function(err, nodeDoc) {
		if (err) {
			console.log("problem getting node: " + err);
		}
		else {
			var node = self.zbee.getNode(nodeDoc.address64);
			if (!node) {
				console.log("no node: " + nodeDoc.address64);
			}
			else {
				var seconds = 10;
				var device = node.getDevice(endpoint);
				if (device) {
					var cluster = device.inputClusters[0x03];
					if (cluster) {
						var command = 0x00;
						console.log("sending identify command");
						var data = [30, 0];	// 30 seconds
						cluster._sendClusterCommand(command, data);
					}
					else {
						console.log("identify not available on node " + address64 + " endpoint " + endpoint);
					}
				}
				else {
					console.log("device not found on node " + address64 + " endpoint " + endpoint);
				}
				//node.devices[endpoint].identify(seconds);
				//node.devices[endpoint].inputClusters[CLUSTER_IDENTIFY].identify(seconds);
				
//				node.zcl.identify(endpoint, seconds, function(err, result) {
//					console.log("identify result : " +util.inspect(err) + " : " + util.inspect(result));
//				});
			}
		}		
	});
}

Coordinator.prototype.addBinding = function(binding, cb) {
	var self = this;
	this.db.getNodeByAddress64(binding.sourceAddress, function(err, nodeDoc) {
		if (err) {
			console.log("problem getting node: " + err);
		}
		else {
			var node = self.zbee.getNode(nodeDoc.address64);
			if (!node) {
				console.log("no node: " + nodeDoc.address64);
			}
			else {
				binding.sourceAddress = addressFromHex(binding.sourceAddress);
				binding.destAddress = addressFromHex(binding.destAddress);
				node.zdo.requestBind(binding, function(err, result) {
					console.log("binding result : " +util.inspect(err) + " : " + util.inspect(result));
				});
			}
		}		
	});
}

/**
 * data: { endpoint, clusterId, configs }
 */
Coordinator.prototype.configReporting = function(address64, data, cb) {
	var self = this;
	this.db.getNodeByAddress64(address64, function(err, nodeDoc) {
		if (err) {
			console.log("configReporting got err: " + err);
		}
		else {
			var node = self.zbee.getNode(nodeDoc.address64);
			if (!node) {
				console.log("no node: " + nodeDoc.address64);
			}
			else {
				var endpoint = data.endpoint;
				var clusterId = data.clusterId;
				var configs = data.configs;
				var device = node.getDevice(endpoint);
				if (device) {
					var cluster = device.getCluster(clusterId);
					if (cluster) {
						cluster.configureReporting(configs, function(err, result) {
							console.log("config reporting result : " + util.inspect(err) + " : " + util.inspect(result));
						});
					}
				}
			}
		}
		if (typeof cb != 'undefined') {
			cb(null, null);
		}
	});
}

/**
 * Discover attributes in a Cluster.
 */
Coordinator.prototype.discoverAttributes = function(address64, endpoint, clusterId, start, max, cb) {
	var self = this;
	this.db.getNodeByAddress64(address64, function(err, nodeDoc) {
		if (err) {
			console.log("discoverAttributes got err: " + err);
		}
		else {
			var node = self.zbee.getNode(nodeDoc.address64);
			if (!node) {
				console.log("no node: " + nodeDoc.address64);
			}
			else {
				node.zcl.discoverAttributes(endpoint, clusterId, start, max, function(err, result) {
					console.log("discoverAttributes result : " + util.inspect(err) + " : " + util.inspect(result));
				});
			}
		}
		if (typeof cb != 'undefined') {
			cb(null, null);
		}
	});	
}


/**
 * Discover nodes on the network
 */
Coordinator.prototype.discover = function() {
	if (DEBUG) {
		console.log("discovering...");
	}
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
		self.emit("init");
			
//			self.getStoredDevices(function(err, docs) {
//				for (var i=0; i<docs.length; i++) {
//					var desc = docs[i];
//					console.log("got stored device: " + desc.id);
//				}
//			});

		var nodes = self.zbee.getNodes();
		for (var addr64 in nodes) {
			self._handleNode(nodes[addr64]);		// handle initial nodes
		}

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
		if (DEBUG) {
			console.log("...node discovery over");
		}
	});
	
	this.zbee.on("newNodeDiscovered", function(node) {
		self._handleNode(node);
	});

	// create nodes in zbee from previously known ones.
	self.getStoredNodes(function(err, nodeDocs) {
		self.zbee.init(nodeDocs);
		
//		for (var i=0; i<nodeDocs.length; i++) {
//			var nodeDoc = nodeDocs[i];
//			var node = self.zbee.getNode(nodeDoc.address);
//			if (!node) {
//				node = self.zbee._createNode(nodeDoc);
//				// ping the node so that it is discovered by ZBee.
//				node.zdo.requestNetworkAddress(function(err, response) {
//					if (err) {
//						console.log("error pinging active endpoints: " + util.inspect(err));
//					}
//					else {
//						console.log("got network address: " + response.remote16);
//						// TODO update addresses in db
//						// TODO send node health event to socketio client
//					}
//				});
//			}
//		}
	});
	
}		// end init()

/**
 * Get nodes from data store.
 */
Coordinator.prototype.getStoredNodes = function(cb) {
	this.db.getNodes(cb);
}

/**
 * Get devices (application objects) from the data store.
 */
Coordinator.prototype.getStoredDevices = function(cb) {
	this.db.getDevices(cb);
}

/**
 * Get Node object from 64bit address
 */
Coordinator.prototype.getNode = function(address64) {
	return self.zbee.getNode(address64);
}

/**
 * Get a zigbee device at a node's endpoint
 */
Coordinator.prototype.getDevice = function(address64, endpoint) {
	var device = null;
	var node = this.getNode(address64);
	if (node) { 
		device = node.getDevice(endpoint);
	}
	return device;
}

Coordinator.prototype._handleNode = function(node) {
	var self = this;
	if (DEBUG) {
		console.log("Node %s discovered", node.remote64.hex);
		//console.log(util.inspect(node));
	}
	
	self.emit("node", node);
	
	// insert or update node info in database
	self.db.persistNode(node, function(err, node) {
	});
	
	// listen for endpoints
	node.zdo.on("endpoints", function(data) {
		// endpoints is an buffer of bytes. One byte per endpoint
		//console.log("got node endpoints: " + util.inspect(data));
		self._handleActiveEndpoints(null, node, data);
	});
	
	node.zdo.on("device", function(desc) {
		self._handleDeviceDescriptor(null, desc);
	});
	
	node.on("attributeReport", function(report) {
		self._handleAttributeReport(null, report);
	});
	
	node.on("data", function(data) {
		console.log("--- node data: %s> %s", node.remote64.hex, util.inspect(data)); 
	});

	node.on("explicit", function(packet) {
		// console.log("got explicit");
		// console.log(util.inspect(packet));
		packet.address64 = node.address64;
		self.emit("explicit", packet);
	});
			
	//this.zbee.on("endpoints", function(data) {
	//console.log("got endpoints for node: " + Tools.bArr2HexStr(data.address));
	//self.db.getNodeByAddress16(data.address, function(err, nodeDoc) {
//		// store endpoints against node
//		var endpoints = [];
//		for (var i=0; i<data.endpoints.length; i++) {
//			endpoint = { id: endpoints[i] };
//			endoints.push(endpoint);
//			node.zdo.requestSimpleDescriptor(endpoints[i], handleEndpointDescriptor);
//		}
//		nodeDoc.endpoints = endpoints;
	//});
	//
	//});
	
	// request the active endpoints for the node.
	setTimeout(function() {
		node.zdo.requestActiveEndpoints(function(err, data) {
			if (err) {
				self._handleActiveEndpoints(err, node, null);
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

	// TEST send on/off
	/*
	var endpoint = 1;
	setTimeout(function() {		// send on/off
		var profileId = 0x0104;		// HA profile
		var clusterId    = 0x0006;	// On/Off cluster
		var frameControl = 0x01;	// specific to cluster
		var sourceEndpoint = 0x00;
		var command = 0x01;	// on command
		var data = new Buffer([ frameControl, node.zdo.zbee._getTxnId(), command ]);
		node.sendZclCommand(clusterId, profileId, sourceEndpoint, endpoint, data);
	}, 5000);
	setTimeout(function() {		// send on/off
		var profileId = 0x0104;		// HA profile
		var clusterId    = 0x0006;	// On/Off cluster
		var frameControl = 0x01;	// specific to cluster
		var sourceEndpoint = 0x00;
		var command = 0x00;	// off command
		var data = new Buffer([ frameControl, node.zdo.zbee._getTxnId(), command ]);
		node.sendZclCommand(clusterId, profileId, sourceEndpoint, endpoint, data);
	}, 7000);
	*/

}

Coordinator.prototype._handleActiveEndpoints = function(err, node, data) {
	if (err) {
		console.log("error getting active endpoints: " + util.inspect(err));
	}
	else {
		if (DEBUG) {
			console.log("got active endpoints for node: " + util.inspect(data));
		}
		//var address16 = data.address16;
		var self = this;
		var endpoints = data.endpoints;
		for (var i=0; i<endpoints.length; i++) {
			node.zdo.requestSimpleDescriptor(endpoints[i], function(err, desc) {
				self._handleDeviceDescriptor(err, desc);
			});
		}
	}
}

Coordinator.prototype._handleDeviceDescriptor = function(err, desc) {
	if (err) {
		console.log("error getting device desc: " + util.inspect(err));
	}
	else {
		var self = this;
		//console.log("received application desc: " + util.inspect(desc));
		//var application = node.getDevice(desc.endpoint);
		this.db.getNodeByAddress16(desc.address16, function(err, node) {
			if (err) {
			}
			else {
				desc.address64 = node.address64;
			}
			self.db.persistApplication(desc, function(err, app) {
				if (err) {
					console.log("error persisting device: " + err);
				}
				else {
					self.emit("device", app);
				}
			});
		});
	}
}

Coordinator.prototype._handleAttributeReport = function(err, report) {
	if (DEBUG) {
		console.log("attribute report: " + JSON.stringify(report));
	}
	this.emit("attributeReport", report);
}



function arrToHex(a) {
	var b = a.map(function (x) {
	    x = x + 0xFFFFFFFF + 1;  // twos complement
	    x = x.toString(16); // to hex
	    x = ("00"+x).substr(-2); // zero-pad to 2-digits
	    return x
	}).join(',');
	return b;
}

function parseHexString(str) { 
    var result = [];
    while (str.length >= 2) { 
        result.push(parseInt(str.substring(0, 2), 16));
        str = str.substring(2, str.length);
    }
    return result;
}

function addressFromHex(str) {
	var addr = {
			dec: parseHexString(str),
			hex: str
	};
	return addr;
}

