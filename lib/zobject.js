var util = require("util");
var EventEmitter = require("events").EventEmitter;

/**
 * A Zigbee Object that sits at an endpoint on a Node.
 */
var ZigbeeObject = exports.ZigbeeObject = function(node, desc) {
	EventEmitter.call(this);

	this.node = node;
	this.zbee = node.xbee;
	
	this.endpoint      = desc.endpoint;			// endpoint id
	this.profileId     = desc.profileId;		// application profile id
}

util.inherits(ZigbeeObject, EventEmitter);

