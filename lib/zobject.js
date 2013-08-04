var util = require("util");
var EventEmitter = require("events").EventEmitter;
var cluster = require("./zcluster");

var Cluster = cluster.Cluster;

var ZigbeeObject = exports.ZigbeeObject = function(node, desc) {
	EventEmitter.call(this);

	this.node = node;
	this.zbee = node.xbee;
	
	this.endpoint      = desc.endpoint;			// endpoint id
	this.profileId     = desc.profileId;		// application profile id

}

util.inherits(ZigbeeObject, EventEmitter);


/* ----------------------------- Application Object ---------------------------- */

/**
 * A Zigbee Application Object, located at an endpoint
 */
var Application = exports.Application = function(node, desc) {
	Application.super_.call(this, node, desc);
	var self = this;
	
	this.node = node;							// the node the endpoint is on
	this._address64    = node.remote64.hex;
	this._address16    = desc.address16;			// node 16 bit address
	
	this.deviceId      = desc.deviceId;			// application device id
	this.deviceVersion = desc.deviceVersion;	// application device version
	this.inputClusters = {};
	this.outputClusters = {};
	
	if (desc.inputClusters) {
		for (var i=0; i<desc.inputClusters.length; i++) {
			var cluster = Cluster.create(this, desc.inputClusters[i], 0);
			cluster.on("attributeReport", function(data) {
				self.emit("attributeReport", data);
			});
			this.inputClusters[ desc.inputClusters[i].id ] = cluster;
		}
	}
	
	if (desc.outputClusters) {
		for (var i=0; i<desc.outputClusters.length; i++) {
			var cluster = Cluster.create(this, desc.outputClusters[i], 1);
			cluster.on("attributeReport", function(data) {
				self.emit("attributeReport", data);
			});
			this.outputClusters[ desc.outputClusters[i].id ] = cluster;
		}
	}
}

util.inherits(Application, ZigbeeObject);

/**
 * Update application object with descriptor
 */
Application.prototype.update = function(desc) {
	var self = this;
	this.endpoint      = desc.endpoint;			// endpoint id
	this.profileId     = desc.profileId;		// application profile id
	this.deviceId      = desc.deviceId;			// application device id
	this.deviceVersion = desc.deviceVersion;	// application device version
	
	if (desc.inputClusters) {
		for (var i=0; i<desc.inputClusters.length; i++) {
			var clusterDesc = desc.inputClusters[i];
			var clusterId = clusterDesc.id;
			var cluster = this.inputClusters[clusterId];
			if (typeof cluster == 'undefined') {
				cluster = Cluster.create(this, clusterDesc, 0);
				cluster.on("attributeReport", function(data) {
					self.emit("attributeReport", data);
				});
				this.inputClusters[clusterId] = cluster;
			}
			else {
				cluster.direction = 0;
			}
		}
	}
	if (desc.outputClusters) {
		for (var i=0; i<desc.outputClusters.length; i++) {
			var clusterDesc = desc.outputClusters[i];
			var clusterId = clusterDesc.id;
			var cluster = this.outputClusters[clusterId];
			if (typeof cluster == 'undefined') {
				cluster = Cluster.create(this, clusterDesc, 1);
				cluster.on("attributeReport", function(data) {
					self.emit("attributeReport", data);
				});
				this.outputClusters[clusterId] = cluster;
			}
			else {
				cluster.direction = 1;
			}
		}
	}
}

Application.prototype.toDesc = function() {
	var spec =   {
			//id : Tools.bArr2HexStr(this.address16) + Tools.dec2Hex(this.endpoint, 2),
			id             : this._address64 + "." + Tools.dec2Hex(this.endpoint, 2),
		    address64      : this._address64,
		    address16      : this._address16,
		    endpoint       : this.endpoint,
		    profileId      : this.profileId,
		    deviceId       : this.deviceId,
		    deviceVersion  : this.deviceVersion,
		    inputClusters  : this.inputClusters,
		    outputClusters : this.outputClusters,
		};
	return spec;
}

/**
 * Bind a cluster on this application ednpoint with the same cluster on the destination endpoint
 */
Application.prototype.bind = function(clusterId, destAdress, destEndpoint) {
	if (typeof destAddress == 'GroupAddress') {
		this.destAddressMode = 0x01;
		this.destAddress = destAddress.address16;
	}
	else {
		this.destAddressMode = 0x03;
		this.destAddress = destAddress.address64;
		this.destEndpoint = destEndpoint;
	}
}
