var util         = require("util");
var EventEmitter = require("events").EventEmitter;
var xbee         = require("svd-xbee");

var DEBUG = false;

var NodeAddress = exports.NodeAddress = function(address64, address16) {
	if (typeof address64 == "Array") {
		
	}
	else if (typeof address64 == "String") {
		
	}
	this.address64 = address64;		// extended address / IEEE address
	this.address16 = address16;		// network address
}

var GroupAddress = exports.GroupAddress = function() {
	this.address16;
}

var EndpointAddress = exports.EndpointAddress = function(nodeAddress, endpoint) {
	this.nodeAddress;
	this.endpoint;
}

var ClusterAddress = exports.ClusterAddress = function(nodeAddress, endpoint, clusterId) {
	this.nodeAddress;
	this.endpoint;
	this.clusterId = clusterId;
}


var BindingType = exports.BindingType = {
	Group    : 0x01,
	Endpoint : 0x03,
}

var Binding = exports.Binding = function() {
	this.type = BindingType.Endpoint;		// endpoint or group.
	this.sourceAddress = null;
	this.sourceEndpoint = null;
	this.clusterId = null;
	this.destAddress = null;		// group address or 64bit node address
	this.destEndpoint = null;		// endpoint, only if endpoint type
}



/**
 * Node logical type
 */
var LogicalType = {
	Coordinator : 0x00,
	Router      : 0x01,
	EndDevice   : 0x02,
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

ModemStatus = {};
ModemStatus[0]    = "Hardware reset";
ModemStatus[1]    = "Watchdog timer reset";
ModemStatus[2]    = "Joined network (routers and end devices)";
ModemStatus[3]    = "Disassociated";
ModemStatus[6]    = "Coordinator started";
ModemStatus[7]    = "Network security key was updated";
ModemStatus[0x0D] = "Voltage supply limit exceeded";
ModemStatus[0x11] = "Modem configuration changed while join in progress";



var Zutil        = require("./zutil");
var node         = require("./znode");
var cluster      = require("./zcluster");

var C          = xbee.C;
var XBee       = xbee.XBee;
var Tools      = exports.Tools      = xbee.Tools;
var ZigbeeNode = exports.ZigbeeNode = node.ZigbeeNode;
var Cluster    = exports.Cluster    = cluster.Cluster;

/**
 * Zigbee XBee device.
 * Provides a Zigbee API via an XBee.
 */
var ZBee = exports.ZBee = function(options) {
	ZBee.super_.call(this, options);
	this.txnId = 0x00;		// initialise the transaction id.
}

util.inherits(ZBee, XBee);

/**
 * If no network is associated, the XBee will try to join network when started.
 * Will also try to join a PAN if network config is changed and applied (applied via AC or CN commands).
 */
ZBee.prototype.joinNetwork = function() {
	// this._AT("CB4", function(err, data) {		// simulate commissioning button press
	// });
}

/**
 * Permit devices to join the network.
 */
ZBee.prototype.allowJoin = function() {
	this._AT("CB2", function(err, data) {		// simulate commissioning button press. enables joining for 1 minute
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
ZBee.prototype.leaveNetwork = function() {
	var self = this;
	// zbee._AT("CB4", function(err, data) {		// simulate commissioning button press
	// });
	this._AT("NR0", function(err, data) {		// tell the coordinator to leave the network
		if (err) {
			console.log("problem leaving the network: " + err);
		}
		else {
			console.log("network left")
			self.emit("leave");
		}
	});
}

/**
 * Configure the XBee for HA Profile
 */
ZBee.prototype.configure = function() {
	this._AT("ZS", [0x02] );			// ZigBee stack profile
	this._AT("SC", [0x63, 0x19]);		// scan channel mask. more: [0x1F, 0xFE]
	//this._AT("SD", [0x12]);			// scan duration
	this._AT("EE", [0x01]);				// set encryption enabled
	this._AT("EO", [0x00]);				// encryption options 0x01 - Send the security key unsecured over-the-air during joins, 0x02 - Use trust center
	this._AT("KY", [
		0x5A, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6C, 0x6C, 0x69, 0x61, 0x6E, 0x63, 0x65, 0x30, 0x39
	]);									// link key for HA: 5A6967426565416C6C69616E63653039
	this._AT("NK", [0x00]);
	this._AT("AO", [0x03]);				// AO=3 to allow XBee to pass-on explicit messages including unhandled ZDO messages
										// AO=1 to allow XBee to pass-on explicit messages
	this._AT("AC");						// Apply Changes
}

/**
 * Applies changes to all command registers causing queued command register values to be applied. 
 * For example, changing the serial interface rate with the BD command will not change the UART 
 * interface rate until changes are applied with the AC command. The CN command and 0x08 API 
 * command frame also apply changes.
 */
ZBee.prototype.applyChanges = function() {
	this._AT("AC", function(err, data) {
	});
}

/**
 * Save XBee settings
 */
ZBee.prototype.save = function() {
	var self = this;
	if (DEBUG) {
		console.log("saving node parameters")
	}
	this._AT("WR", function(err, data) {
		if (err) {
			console.log("problem saving parameters: " + err);
		}
		else {
			if (DEBUG) {
				console.log("parameters saved");
			}
			self.emit("saved", "Device parameters saved");
		}
	});
}

/**
 * Perform a factory reset on the XBee
 */
ZBee.prototype.reset = function() {
	var self = this;
	this._AT("FR", function(err, data) {
		self.emit("reset", "Device reset");
	});
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
ZBee.prototype.checkAssociation = function(cb) {
	if (DEBUG) {
		console.log("checking association")
	}
	this._AT("AI", function(err, data) {		// // get association information
		if (err) {
			console.log("error checking association: " + err);
		}
		else {
			if (DEBUG) {
				console.log("got association info: " + data);
			}
		}
		if (typeof cb != 'undefined') {
			cb(err, data);
		}
	});
}

ZBee.prototype.setEncryptionEnabled = function(val) {
	val = val ? 0x01 : 0x00;
	this._AT("EE", [val], function(err, data) {
		console.log("encryption set: "  + val);
	})
}

/**
 * Log XBee details
 */
ZBee.prototype.getXbeeDetails = function() {
	this._AT("MY", function(err, data) {
		console.log("my address: " + JSON.stringify(data));
	})
	this._AT("MP", function(err, data) {
		console.log("parent address: " + JSON.stringify(data));
	})
	this._AT("OP", function(err, data) {
		console.log("operating pan: " + JSON.stringify(data));
	})
}

ZBee.prototype.getNodes = function() {
	return this.nodes;
}

/**
 * address: hex string of 64bit address
 */
ZBee.prototype.getNode = function(address64) {
	return this.nodes[address64];
}

ZBee.prototype._putNode = function(node) {
	this.nodes[node.remote64.hex] = node;
}


/**
 * ?????
 */
ZBee.prototype.createSourceRoute = function(addresses, remote64, remote16, _cb) {
	var packets = [];
	var frame = new Zutil.CreateSourceRoute();
	frame.destination64 = remote64.dec;
	frame.destination16 = remote16.dec;

	// TODO proper cdid
	var cbid = C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE + C.EVT_SEP + frame.frameId;
	var packet = [ this._makeTask({
		data : frame.getBytes(),
		cbid : cbid
	}) ];
	this._queue.push({
		packets : packet,
		cb : _cb
	});
	return cbid;
}

ZBee.prototype.sendZdoCommand = function(remote64, remote16, clusterId, data, _cb) {
	var txn = this._getTxnId();
	var frame = new Zutil.ZigbeeCommandFrame();
	frame.destination64 = remote64.dec;
	frame.destination16 = remote16.dec;

	frame.sourceEndpoint  = 0x00;		// ZDO endpoint is 0   
	frame.destEndpoint    = 0x00;		// ZDO endpoint is 0   
	frame.clusterId       = clusterId;
	frame.profileId       = 0x0000;		// ZDO profileId = 0
	frame.broadcastRadius = 0x00;
	frame.txOptions       = 0x00;		// must be set to 0

	frame.data = Buffer.concat([new Buffer([txn]), data]);

	// TODO proper cdid
	var cbid = C.FRAME_TYPE.ZIGBEE_EXPLICIT_RX + C.EVT_SEP + txn;
	var packet = [ this._makeTask({
		data : frame.getBytes(),
		cbid : cbid
	}) ];
	this._queue.push({
		packets : packet,
		cb : _cb
	});
	return cbid;
}

ZBee.prototype.sendZclCommand = function(remote64, remote16, sep, dep, clusterId, profileId, data, _cb) {
	var packets = [];
	var frame = new Zutil.ZigbeeCommandFrame();
	frame.destination64 = remote64.dec;
	frame.destination16 = remote16.dec;
	frame.sourceEndpoint = sep;
	frame.destEndpoint = dep;
	frame.clusterId = clusterId;
	frame.profileId = profileId;
	frame.broadcastRadius = 0x00;
	frame.txOptions = 0x00; // must be set to 0
	frame.data = data;

	// TODO proper cdid
	var txn = data[1];
	var cbid = C.FRAME_TYPE.ZIGBEE_EXPLICIT_RX + C.EVT_SEP + txn;
	var packet = [ this._makeTask({
		data : frame.getBytes(),
		cbid : cbid
	}) ];
	this._queue.push({
		packets : packet,
		cb : _cb
	});
	return cbid;
}

/**
 * Initialise the ZBee.
 */
ZBee.prototype.init = function(nodeDescs) {
	XBee.prototype.init.call(this);		// call super init()

	var self = this;
	
	this.serial.on(C.FRAME_TYPE.ZIGBEE_EXPLICIT_RX, function(packet) {
		self._onExplicitRx(packet);
	});
	this.serial.on(C.FRAME_TYPE.ROUTE_RECORD, function(packet) {
		self._onRouteRecord(packet);
	});
	
	this.on("initialized", function(params) {
		var hex = self.parameters.sourceHigh + self.parameters.sourceLow;
		var dec = [];
		for (var i=0; i<hex.length; i+=2) {
			var val = parseInt(hex.slice(i, i+2), 16);
			dec.push(val);
		}
		var nwk = [0xff,0xfe]
		//var nwk = [00,00];
		self.localNode = self.addNode(dec, nwk, self.data_parser);
		if (DEBUG) {
			console.log("self node: " + util.inspect(self.localNode.remote64));
		}
	});
	
	if (nodeDescs) {
		for (var i=0; i<nodeDescs.length; i++) {
			var nodeDesc = nodeDescs[i];
			var node = self.getNode(nodeDesc.address);
			if (!node) {
				node = self._createNode(nodeDesc);
				if (DEBUG) {
					console.log("putting node: " + node.remote64.hex);
				}
				self._putNode(node);
			}
		}
	}
}



ZBee.prototype._getTxnId = function() {
	this.txnId++;
	this.txnId %= 255;
	if (this.txnId == 0) {
		this.txnId = 1; // 0x00 means: no response expected
	}
	return this.txnId;
}

ZBee.prototype._createNode = function(data) {
	//console.log("creating new node for : " + util.inspect(data));
	var self = this;
	var node = new ZigbeeNode(this, data, this.data_parser);
	node.on("deviceFound", function(device) {
		self.emit("device", device);
	});
	node.on("deviceUpdated", function(device) {
		self.emit("device", device);
	});
	return node;
}

ZBee.prototype._onExplicitRx = function(packet) {
	if (!this.nodes[packet.remote64.hex]) {
		var node = this.addNode(packet.remote64.dec, packet.remote16.dec, this.data_parser);
		this.emit("newNodeDiscovered", node);
	}
	if (packet.profileId == 0) {	// Zigbee Device Profile - ZDP
		if (packet.destEndpoint != 0) {
			// error: invalid endpoint
			return;
		}
		if (packet.clusterId < 0x8000) {		// incoming ZDO request
			// handle ZDO request, provide appropriate response
			this._handleZdo(packet);
			//return;
		}
	}

	this.nodes[packet.remote64.hex]._onExplicitRx(packet);
}

ZBee.prototype._onRouteRecord = function(data) {
	if (!this.nodes[data.remote64.hex]) {
		var node = this.addNode(data.remote64.dec, data.remote16.dec, this.data_parser);
		this.emit("newNodeDiscovered", node);
	}
	this.nodes[data.remote64.hex]._onRouteRecord(data);
}

ZBee.prototype._handleZdo = function(packet) {
	//console.log("got ZDO request on cluster: " + packet.clusterId + " received option: " + packet.receiveOptions);

	switch(packet.clusterId) {
	
		//case ClusterId.ZDP_EndDeviceAnnce:	// End Device announcement
		case 0x13:	// End Device announcement
			//this._handleEndDeviceAnnounce(packet);
			/// EndDevice Announce is handled by node's ZDO object
			break;

			// TODO handle the folling incoming requests:
			//	ZDP_NwkAddrReq           : 0x0000,
			//	ZDP_IeeeAddrReq          : 0x0001,
			//	ZDP_NodeDescReq          : 0x0002,
			//	ZDP_PowerDescReq         : 0x0003,
			//	ZDP_SimpleDescReq        : 0x0004,
			//	ZDP_ActiveEpReq          : 0x0005,
			//	ZDP_MatchDescReq         : 0x0006,
			//	ZDP_ComplexDescReq       : 0x0010,
			//	ZDP_UserDescReq          : 0x0011,
			//	ZDP_DiscoveryRegisterReq : 0x0012,
			//	ZDP_UserDescSet          : 0x0014,
			//	ZDP_EndDeviceBindReq     : 0x0020,
			//	ZDP_BindReq              : 0x0021,
			//	ZDP_UnbindReq            : 0x0022,
			//	ZDP_MgmtNwkDiscReq       : 0x0030,
			//	ZDP_MgmtLqiReq           : 0x0031,
			//	ZDP_MgmtRtgReq           : 0x0032,
			//	ZDP_MgmtBindReq          : 0x0033,
			//	ZDP_MgmtLeaveReq         : 0x0034,
			//	ZDP_MgmtDirectJoinReq    : 0x0035,

		default:
			console.log("Unhandled incoming ZDO command for cluster: " + packet.clusterId);
	}
	
}

ZBee.prototype._handleEndDeviceAnnounce = function(packet, cb) {
	var data = packet.rawData;
	var announce = {};
	announce.address16 = [packet.rawData[2], packet.rawData[1]];
	announce.address64 = [packet.rawData[10], packet.rawData[9], packet.rawData[8], packet.rawData[7], packet.rawData[6], packet.rawData[5], packet.rawData[4], packet.rawData[3]];
	announce.capability = packet.rawData[11];
	
	if (DEBUG) {
		console.log("Node " + this.node.remote64.hex + " got End Device Announce: " + util.inspect(announce));
	}

	this.emit("announce", announce);
	
	var node = this.getNode(announce.address64);
	if (node) {
		this.emit("node", node);
	}

	if (typeof cb != 'undefined') {
		cb(null, announce);
	}
}

