var util = require("util");
var Cluster = require("../../zcluster").Cluster;

// var profileId = 0x0104;		// HA
// var clusterId = 0x0006;	// OnOff

var OnOff = exports.Cluster = function(device, direction) {
	Cluster.call(this, device, 0x0006, direction);
	this.frameControl = 0x01;	// specific to cluster
}
util.inherits(OnOff, Cluster);

/**
 * Binary value.
 */
OnOff.prototype.binaryValue = function(value, cb) {
	//var sourceEndpoint = 0x00;
	var command = value ? 0x01 : 0x00;
	//var data = new Buffer([ this.frameControl, this.node.zbee._getTxnId(), command, 0x00, 0x00 ]);
	//this.node.sendZclCommand(this.clusterId, this.profileId, sourceEndpoint, this.endPoint, data, cb);
	
	var data = new Buffer([ 0x00, 0x00 ]);
	this._sendClusterCommand(command, data, cb);
}

OnOff.prototype.toggle = function(value, cb) {
	var command = 0x02;
	var data = new Buffer([ 0x00, 0x00 ]);
	this._sendClusterCommand(command, data, cb);
}