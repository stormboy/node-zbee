var util = require("util");
var xbee = require("svd-xbee");
var Zutil = require("./zigbee-util");

var ZDO = require("./zdo").ZDO;
var ZCL = require("./zcl").ZCL;
var XBee = xbee.XBee;
var Node = xbee.Node;
var C = xbee.C;

// sample of a binding
var testBinding = {
	srcEndpoint : 5,
	dstAddress : 0x1234,
	addrGrp : 'A', // address 'A' or group 'G'
	dstEndpoint : 12,
	clusterId : 0x0006,
}

exports.Tools = xbee.Tools;

/**
 * Zigbee XBee device
 */
var ZBee = exports.ZBee = function(options) {
	ZBee.super_.call(this, options);

	this.txnId = 0x00;
}

util.inherits(ZBee, XBee);

ZBee.prototype.init = function() {
	var self = this;

	console.log("ZBee initilising");

	XBee.prototype.init.call(this);

	// Added by Warren
	self._onExplicitRx = function(data) {
		if (!self.nodes[data.remote64.hex]) {
			var node = self.addNode(data.remote64.dec, data.remote16.dec, self.data_parser);
			self.emit("newNodeDiscovered", node);
		}
		self.nodes[data.remote64.hex]._onExplicitRx(data);
	}
	self._onRouteRecord = function(data) {
		if (!self.nodes[data.remote64.hex]) {
			var node = self.addNode(data.remote64.dec, data.remote16.dec,
					self.data_parser);
			self.emit("newNodeDiscovered", node);
		}
		self.nodes[data.remote64.hex]._onRouteRecord(data);
	}

	// Added by Warren
	self.serial.on(C.FRAME_TYPE.ZIGBEE_EXPLICIT_RX, self._onExplicitRx);
	self.serial.on(C.FRAME_TYPE.ROUTE_RECORD, self._onRouteRecord);

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
	return new ZigbeeNode(this, data, this.data_parser)
}

/**
 * address: hex 64bit address
 */
ZBee.prototype.getNode = function(address) {
	return this.nodes[address];
}

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

	frame.sourceEndpoint = 0x00; // ZDO endpoint is 0   
	frame.destEndpoint = 0x00; // ZDO endpoint is 0   
	frame.clusterId = clusterId;
	frame.profileId = 0x0000; // ZDO profileId = 0
	frame.broadcastRadius = 0x00;
	frame.txOptions = 0x00; // must be set to 0

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
 * A Zigbee node on the network
 */
var ZigbeeNode = exports.ZigbeeNode = function(zbee, params, data_parser) {
	ZigbeeNode.super_.call(this, zbee, params, data_parser);
	this.zdo = new ZDO(zbee, this);
	this.zcl = new ZCL(zbee, this);

}
util.inherits(ZigbeeNode, Node);


ZigbeeNode.prototype.createSourceRoute = function(addresses, cb) {
	this.xbee.createSourceRoute(addresses, this.remote64, this.remote16, cb);
}

/**
 * Send ZDO command
 */
ZigbeeNode.prototype.sendZdoCommand = function(clusterId, data, cb) {
	this.xbee.sendZdoCommand(this.remote64, this.remote16, clusterId, data, cb);
}

/**
 * Send Cluster Library message
 */
ZigbeeNode.prototype.sendZclCommand = function(clusterId, profileId, sep, dep, data, cb) {
	this.xbee.sendZclCommand(this.remote64, this.remote16, sep, dep, clusterId, profileId, data, cb);
}

ZigbeeNode.prototype._onExplicitRx = function(packet) {
	//console.log(">>> RX: " + util.inspect(packet));
	
	var data = new Buffer(packet.rawData);
	if (this.xbee.use_heartbeat) {
		this.refreshTimeout();
		if (data === this.xbee.heartbeat_packet)
			return;
	}

	if (this.parser !== undefined) {
		this.parser.parse(data);
	}
	else {
		if (packet.profileId == 0) {	// if the packet is for ZDP get the ZDO to handle
			this.zdo.handleRx(packet, data, this);
		}
		else {
			this.emit('explicit', data, packet);
		}
	}
}

/**
 * 
 */
ZigbeeNode.prototype._onRouteRecord = function(packet) {
	// parse addresses into 2byte addresses
	var addresses = [];
	var rawData = packet.rawData;
	while (rawData.length > 2) {
		addresses.push(parseAddress(rawData.splice(0, 2)));
	}

	if (this.xbee.use_heartbeat) {
		this.refreshTimeout();
		if (data === this.xbee.heartbeat_packet)
			return;
	}

	if (this.parser !== undefined)
		this.parser.parse(data);
	else
		this.emit('route', addresses, packet);
}


/**
 * A Zigbee Endpoint
 */
var Endpoint = exports.Endpoint = function(node, desc) {
	this.node = node;		// the node the endpoint is on
	this.nodeAddress = desc.address;		// node 16 bit address
	this.id = id			// endpoint id
	this.profileId = null;
	this.deviceId = null;
	this.deviceVersion = desc.deviceVersion;
	
	this.inputClusters = {};
	for (var i=0; i<desc.inputClusters.length; i++) {
		this.inputClusters[ desc.inputClusters[i] ] = new Cluster(id);
	}
	this.outputClusters = {};
	for (var i=0; i<desc.outputClusters.length; i++) {
		this.outputClusters[ desc.outputClusters[i] ] = new Cluster(id);
	}
}

var Cluster = exports.Cluster = function(id) {
	this.id = id;				// cluster id
}
