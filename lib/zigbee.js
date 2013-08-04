var util = require("util");
var EventEmitter = require("events").EventEmitter;
var xbee = require("svd-xbee");
var Zutil = require("./zutil");
var node = require("./znode");
var cluster = require("./zcluster");

var XBee = xbee.XBee;
var C = xbee.C;

var ZigbeeNode = exports.ZigbeeNode = node.ZigbeeNode;
var Cluster    = exports.Cluster    = cluster.Cluster;

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
	console.log("ZBee initilising");
	XBee.prototype.init.call(this);

	var self = this;
	self._onExplicitRx = function(packet) {
		if (!self.nodes[packet.remote64.hex]) {
			var node = self.addNode(packet.remote64.dec, packet.remote16.dec, self.data_parser);
			self.emit("newNodeDiscovered", node);
		}
		if (packet.profileId == 0) {
			if (packet.destEndpoint != 0) {
				// error: invalid endpoint
				return;
			}
			if (packet.clusterId < 0x8000) {		// response
				console.log("got ZDO request on cluster: " + packet.clusterId + " received option: " + packet.receiveOptions);
				// TODO handle ZDO request
				return;
			}
			// is a ZDO request (or response?)
			//console.log("got ZDO response on cluster: " + packet.clusterId + " received option: " + packet.receiveOptions);
		}

		self.nodes[packet.remote64.hex]._onExplicitRx(packet);
	}
	
	self._onRouteRecord = function(data) {
		if (!self.nodes[data.remote64.hex]) {
			var node = self.addNode(data.remote64.dec, data.remote16.dec, self.data_parser);
			self.emit("newNodeDiscovered", node);
		}
		self.nodes[data.remote64.hex]._onRouteRecord(data);
	}

	// Added by Warren
	self.serial.on(C.FRAME_TYPE.ZIGBEE_EXPLICIT_RX, function(packet) {
		self._onExplicitRx(packet);
	});
	self.serial.on(C.FRAME_TYPE.ROUTE_RECORD, function(packet) {
		self._onRouteRecord(packet);
	});
	
	
	self.on("initialized", function(params) {
		var hex = self.parameters.sourceHigh + self.parameters.sourceLow;
		var dec = [];
		for (var i=0; i<hex.length; i+=2) {
			var val = parseInt(hex.slice(i, i+2), 16);
			dec.push(val);
		}
		//dec = [0, 0, 0, 0, 0, 0, 0, 0]; // unicast to coordinator
		//dec = [0, 0, 0, 0, 0, 0, 0xFF, 0xFF];
		//console.log("self node address: " + util.inspect(dec));
		var nwk = [0xff,0xfe]
		//var nwk = [00,00];
		self.localNode = self.addNode(dec, nwk, self.data_parser);
		console.log("self node: " + util.inspect(self.localNode.remote64));
	});
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
 * address: hex string of 64bit address
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

	frame.sourceEndpoint = 0x00;	// ZDO endpoint is 0   
	frame.destEndpoint = 0x00;		// ZDO endpoint is 0   
	frame.clusterId = clusterId;
	frame.profileId = 0x0000;		// ZDO profileId = 0
	frame.broadcastRadius = 0x00;
	frame.txOptions = 0x00;			// must be set to 0

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

var NodeAddress = exports.NodeAddress = function(address64, address16) {
	if (typeof address64 == "Array") {
		
	}
	else if (typeof address64 == "String") {
		
	}
	this.address64 = address64;
	this.address16 = address64;
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
