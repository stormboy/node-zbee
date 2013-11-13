var util = require("util");
var cluster = require("./zcluster");
var zobject = require("./zobject");

var ZigbeeObject = zobject.ZigbeeObject;
var Cluster      = cluster.Cluster;

/* ----------------------------- Device / Application Object ---------------------------- */

/**
 * A Zigbee Application Object (or Device), located at an Endpoint of a Zigbee Node
 * 
 * node: 
 * desc: {
 *   address16: byte[2]
 *   endpoint: byte
 *   profileId: int(2)
 *   deviceId
 *   deviceVersion
 *   inputClusters[]: [{ id }, ]
 *   outputClusters: [{ id }, ]
 * }
 */
var Device = exports.Device = function(node, desc) {
	Device.super_.call(this, node, desc);
	var self = this;
	
	this._address64    = node.remote64.hex;
	this._address16    = desc.address16;			// node 16 bit address
	
	this.endpoint      = desc.endpoint;
	this.profileId     = desc.profileId;
	this.deviceId      = desc.deviceId;			// application device id
	this.deviceVersion = desc.deviceVersion;	// application device version
	this.inputClusters = {};
	this.outputClusters = {};
	
	if (desc.inputClusters) {
		for (var i=0; i<desc.inputClusters.length; i++) {
			var cluster = Cluster.create(this, desc.inputClusters[i].id, 0);
			cluster.on("attributeReport", function(data) {
				self.emit("attributeReport", data);
			});
			this.inputClusters[ desc.inputClusters[i].id ] = cluster;
		}
	}
	
	if (desc.outputClusters) {
		for (var i=0; i<desc.outputClusters.length; i++) {
			var cluster = Cluster.create(this, desc.outputClusters[i].id, 1);
			cluster.on("attributeReport", function(data) {
				self.emit("attributeReport", data);
			});
			this.outputClusters[ desc.outputClusters[i].id ] = cluster;
		}
	}
}

util.inherits(Device, ZigbeeObject);

Device.prototype.getCluster = function(clusterId) {
	var cluster = this.inputClusters[clusterId];
	if (!cluster) {
		cluster = this.outputClusters[clusterId];
	}
	return cluster;
}

/**
 * Update application object with descriptor
 */
Device.prototype.update = function(desc) {
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

Device.prototype.toDesc = function() {
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
Device.prototype.bind = function(clusterId, destAdress, destEndpoint) {
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
