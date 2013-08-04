var util    = require("util");
var xbee    = require("svd-xbee");
var zdo     = require("./zdo");
var zobject = require("./zobject");
var cluster = require("./zcluster");

var Node = xbee.Node;
var ZDO = zdo.ZDO;
var Application = zobject.Application;
var Cluster = cluster.Cluster;

var HEALTH_INTERVAL = 600000;

/**
 * A Zigbee node on the network
 */
var ZigbeeNode = exports.ZigbeeNode = function(zbee, params, data_parser) {
	var self = this;
	ZigbeeNode.super_.call(this, zbee, params, data_parser);
	this.alive = false;				// whether ZB node is online
	this.applications = {};			// application objects
	this.zdo = new ZDO(this);		// zigbee device objects
	
	//this.zcl = new ZCL(this);
	
	this.zdo.on("announce", function(data) {
		self._handleAnnounce(data);
	});
	this.zdo.on("nodeDescriptor", function(data) {
		self._handleAnnounce(data);
	});
	this.zdo.on("powerDescriptor", function(data) {
		self._setPowerDescriptor(data);
	});
	this.zdo.on("simpleDescriptor", function(desc) {
		self._putApplication(desc);
	});
	this.zdo.on("complexDescriptor", function(data) {
		self._setComplexDescriptor(data);
	});
	this.zdo.on("userDescriptor", function(data) {
		self._setUserDescriptor(data);
	});
		
	this.healthTimer = setTimeout(function() {
			self._healthTimeout() 
		}, HEALTH_INTERVAL);
}

util.inherits(ZigbeeNode, Node);

/**
 * Add an application object to this node.
 * desc is a "Simple Descriptor".
 */
ZigbeeNode.prototype._putApplication = function(desc) {
	var application = this.applications[desc.endpoint];
	if (typeof application == 'undefined') {
		application = new Application(this, desc);
		application.on("attributeReport", function(data) {
			self.emit("attributeReport", data);
		});
		this.applications[desc.endpoint] = application;
	}
	else {		// update existing application object
		application.update(desc);
	}
}


ZigbeeNode.prototype._setNodeDescriptor = function(desc) {
	// TODO update node descriptor
	// from node descriptor
	this.logicalType;
	this.complexDescriptorAvailable;
	this.userDescriptorAvailable;
	this.apsFlags;
	this.frequencyBand;
	this.macCapabilityFlags;
	this.maxBufferSize;
	this.maxInTransferSize;
	this.serverMask;
	this.maxOutTransferSize;
	this.descriptorCapabilityField;
	
}

ZigbeeNode.prototype._setPowerDescriptor = function(desc) {
	// TODO update power desc
	// from power descriptor
	this.currentPowerMode;
	this.availablePowerSources;
	this.currentPowerSource;
	this.currentPowerSourceLevel;
}


ZigbeeNode.prototype._setComplexDescriptor = function(desc) {
	// TODO parse XML 
	this.language;
	this.characterSet;
	this.manufacturerName;
	this.modelName;
	this.serialNumber;
	this.deviceUrL;
	this.icon;
	this.iconUrl;
}

/**
 * 16 byte description
 */
ZigbeeNode.prototype._setUserDescriptor = function(description) {
	this.userDescription = userDescription
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

/**
 * Handle explicit Rx.
 */
ZigbeeNode.prototype._onExplicitRx = function(packet) {

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
			this.zdo.handleRx(packet);
		}
		else {
			var self = this;
			//console.log(">>> RX: " + util.inspect(packet));
			var endpoint = packet.sourceEndpoint;
			var clusterId = packet.clusterId;
			
			// get app and cluster object to route message to
			
			var app = this.applications[endpoint];
			if (typeof app == 'undefined') {
				console.log("Node " + this.remote64.hex + ": could not locate app for endpoint: " + endpoint);
				app = new Application(this, {
					endpoint: packet.sourceEndpoint,
					profileId: packet.profileId,
					address16: packet.remote16.hex,
				});
				app.on("attributeReport", function(data) {
					self.emit("attributeReport", data);
				});
				this.applications[endpoint] = app;
			}
			
			var cluster = app.inputClusters[clusterId];
			if (typeof cluster == 'undefined') {
				cluster = app.outputClusters[clusterId];
			}
			if (typeof cluster == 'undefined') {
				console.log("Node " + this.remote64.hex + ": could not locate cluster for endpoint: " + endpoint + ", clusterID: " + clusterId);
				cluster = new Cluster(app, clusterId);
				cluster.on("attributeReport", function(data) {
					app.emit("attributeReport", data);
				});

				//app.outputClusters[clusterId] = cluster;  // input or output?????
			}
			
			cluster.handleRx(packet);
			//this.zcl.handleRx(packet);
		}
	}
}

/**
 * 
 */
ZigbeeNode.prototype._onRouteRecord = function(packet) {
	// parse addresses into 2byte addresses
	var addresses = [];
	var data = packet.rawData;
	while (data.length > 2) {
		//addresses.push(parseAddress(rawData.splice(0, 2)));
		addresses.push(data.slice(0, 2));
		data = data.slice(2);
	}

	//console.log(">>> Route: " + util.inspect(packet));

	if (this.xbee.use_heartbeat) {
		this.refreshTimeout();
		if (data === this.xbee.heartbeat_packet)
			return;
	}
	
	if (this.parser !== undefined) {
		this.parser.parse(data);
	}
	else {
		this.emit('route', addresses, packet);
	}
}

ZigbeeNode.prototype.toDesc = function() {
	var desc =   {
			address64  : this.remote64.hex,
			address16  : this.remote16.hex,
		    remote16   : this.remote16,
		    remote64   : this.remote64,
		    id         : this.id,
		    deviceType : this.deviceType,
		    apps       : this.apps,
		};
	return desc;
}


