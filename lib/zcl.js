/**
 * Zigbee Cluster Library
 * 
 */
var util = require("util");

var ZCL = function(zbee, node) {
	this.zbee = zbee;
	this.node = node;
}

ZCL.prototype.sendOnOff = function(endpoint, value, cb) {
	var clusterId = 0x0006		// On/Off
	var profileId = 0x0104;		// HA
	var sourceEndpoint = 0x00;
	console.log("sending On/Off Request");
	var address = this.node.remote16.dec;
	
	var val = value ? 0x01 : 0x00;
	var data = new Buffer([ 0x01, this.zbee._getTxnId(), val, 0x00, 0x00 ]);

	var callback = cb;
	/*var callback = function(err) {
		if (err) {
			console.log("problem sending On/Off command: " + util.inspect(err));
		}
		else {
			console.log("sent On/Off Request");
		}
		cb(err);
	}*/
	this.node.sendZclCommand(clusterId, profileId, sourceEndpoint, endpoint, data, callback);
}

exports.ZCL = ZCL;


var ZclFrame = function() {
	
}

ZclFrame.prototype.toBytes = function() {
	return 0x09;
}

