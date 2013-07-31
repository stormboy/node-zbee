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

var HEALTH_INTERVAL = 600000;

/**
 * A Zigbee node on the network
 */
var ZigbeeNode = exports.ZigbeeNode = function(zbee, params, data_parser) {
	var self = this;
	ZigbeeNode.super_.call(this, zbee, params, data_parser);
	this.alive = false;				// whether ZB node is online
	this.applications = {};
	
	this.zdo = new ZDO(zbee, this);
	this.zcl = new ZCL(zbee, this);
	
	this.zdo.on("application", function(desc) {
		self._putApplication(desc);
	});
	this.zdo.on("announce", function(data) {
			self._handleAnnounce(data);
	});
	this.healthTimer = setTimeout(function() {
			self._healthTimeout() 
		}, HEALTH_INTERVAL);
}

util.inherits(ZigbeeNode, Node);

ZigbeeNode.prototype._putApplication = function(desc) {
	//console.log("putting application: " + desc.endpoint);
	var application = new Application(this, desc);
	this.applications[desc.endpoint] = application;
}

ZigbeeNode.prototype._handleAnnounce = function(data) {
	var self = this;
	this.capability = data.capability;
	// update or restart health timer and send health OK event
	clearTimeout(this.healthTimer);
	this.healthTimer = setTimeout(function() {
		self._healthTimeout() ;
	}, HEALTH_INTERVAL);
	this.emit("alive");
	this.xbee.emit("lifecycle", this.remote64, "alive");
}

ZigbeeNode.prototype._healthTimeout = function(desc) {
	this.emit("missing");
	this.xbee.emit("lifecycle", this.remote64, "missing");
}

ZigbeeNode.prototype.getApplication = function(endpoint) {
	//console.log("getting application at endpoint: " + endpoint);
	return this.applications[endpoint];
}

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
			this.zdo.handleRx(packet, this);
		}
		else {
			this.emit('explicit', packet);
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

ZigbeeNode.prototype.toDesc = function() {
	var desc =   {
			address64  : this.remote64.hex,
			address16  : this.remote16.hex,
		    remote16   : this.remote16,
		    remote64   : this.remote64,
		    id         : this.id,
		    deviceType : this.deviceType,
		};
	return desc;
}


/**
 * A Zigbee Application, located at an endpoint
 */
var Application = exports.Application = function(node, desc) {
	this.node = node;		// the node the endpoint is on
	this.address16 = desc.address16;		// node 16 bit address
	this.endpoint = desc.endpoint;		// endpoint id
	this.profileId = desc.profileId;
	this.deviceId = desc.deviceId;
	this.deviceVersion = desc.deviceVersion;
	
	this.inputClusters = {};
	for (var i=0; i<desc.inputClusters.length; i++) {
		this.inputClusters[ desc.inputClusters[i] ] = new Cluster(this.id, this.profileId);
	}
	this.outputClusters = {};
	for (var i=0; i<desc.outputClusters.length; i++) {
		this.outputClusters[ desc.outputClusters[i] ] = new Cluster(this.id, this.profileId);
	}
}

Application.prototype.toDesc = function() {
	var spec =   {
			//id : Tools.bArr2HexStr(this.address16) + Tools.dec2Hex(this.endpoint, 2),
			id             : this.address16 + Tools.dec2Hex(this.endpoint, 2),
		    address16      : this.address16,
		    endpoint       : this.endpoint,
		    profileId      : this.profileId,
		    deviceId       : this.deviceId,
		    deviceVersion  : this.deviceVersion,
		    inputClusters  : this.inputClusters,
		    outputClusters : this.outputClusters,
		};
	return spec;
}

var Cluster = exports.Cluster = function(id, profileId) {
	this.id = id;		// cluster id
	this.profileId = profileId;
}

var Binding = exports.Binding = function() {
	this.type = BindingType.endpoint;		// endpoint or group.
	this.sourceAddress = null;
	this.sourceEndpoint = null;
	this.clusterId = null;
	this.destAddress = null;		// group address or 64bit node address
	this.destEndpoint = null;		// endpoint, only if endpoint type
}

var BindingType = exports.BindingType = {
	group    : 0x01,
	endpoint : 0x03,
}
