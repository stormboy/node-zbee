var util = require("util");
var EventEmitter = require("events").EventEmitter;

/**
 * A cluster.
 */
var Cluster = exports.Cluster = function(app, clusterId, direction) {
	EventEmitter.call(this);
	
	this.app  = app;
	this.node = app.node;
	this.zbee = app.node.zbee;
	
	this.endpoint    = app.endpoint;
	this.profileId   = app.profileId;
	this.clusterId   = clusterId;		// cluster id
	this.direction   = direction;
	this.commands    = [];
	this.attributes  = [];
}

util.inherits(Cluster, EventEmitter);

/**
 * static create function
 */
Cluster.create =  function(app, clusterId, direction) {
	
	// TODO create appropriate cluster based on clusterId
	
	return new Cluster(app, clusterId, direction);
}

Cluster.prototype._sendCommand = function(frameControl, command, data, cb) {
	var sourceEndpoint = this.endpoint;
	var txn = this.zbee._getTxnId();
	var payload = [ frameControl, txn, command ].concat(data);

	this.node.sendZclCommand(this.clusterId, this.profileId, sourceEndpoint, this.endpoint, new Buffer(payload), cb);
}

/**
 * Send a general command that is not specific to the cluster
 */
Cluster.prototype._sendGeneralCommand = function(command, data, cb) {
	this._sendCommand(0x00, command, data, cb);
}

/**
 * Send a cluster-specific command on this cluster.
 */
Cluster.prototype._sendClusterCommand = function(command, data, cb) {
	this._sendCommand(0x01, command, data, cb);
}


/* ---------------------------- General (non-cluster-specific) commands ---------------------------------- */

/**
 * "attributes" is an array of integers (16bit) representing attributes IDs
 */
Cluster.prototype.readAttributes = function(attributes, cb) {
	var data = [];
	if (attributes) {
		for (var i=0; i<attributes; i++) {
			attrId = attributes[i];
			data.push(attrId & 0xFF);
			data.push((attrId >> 8) & 0xFF);
		}
	}

	this._sendGeneralCommand(GeneralCommands.READ_ATTRIBUTES, data, cb);
}

/**
 * each record has an attribute id (16bit), data type (8bit) and data (variable).
 * e.g. { id: 0x0001, type: 0x01, data: [0x01, 0x01, 0x01, 0x01] }
 */
Cluster.prototype.writeAttributes = function(records, cb) {
	var data = [];
	if (records) {
		for (var i=0; i<records; i++) {
			record = records[i];
			data.push(record.id & 0xFF);
			data.push((record.id >> 8) & 0xFF);
			data.push(record.type);
			var recordData = record.data;
			for (j=0; j<recordData.length; j++) {
				data.push(recordData[j]);
			}
		}
	}

	this._sendGeneralCommand(GeneralCommands.WRITE_ATTRIBUTES, data, cb);
}

/**
 * config example
 * {
 * 	 direction: 0x01,
 *   id: 0x0001,
 *   type: 0x01,                         // if direction == 0
 *   minInterval: 0x0001,                // if direction == 0
 *   maxInterval: 0x0001,                // if direction == 0. if 0xFFFF, then cancel/no report
 *   change: [0x00, 0x00, 0x00, 0x00 ],  // if direction == 0
 *   timeout: 0x0000                     // if direction == 1
 * }
 */
Cluster.prototype.configureReporting = function(configs, cb) {
	var data = [];
	if (configs) {
		for (var i=0; i<configs.length; i++) {
			config = configs[i];
			data.push(config.direction);
			if (config.direction == 0) {
				data.push(config.id & 0xFF);
				data.push((config.id >> 8) & 0xFF);
				data.push(config.type);
				var minInterval = config.minInterval ? config.minInterval : 0x0001;
				data.push(minInterval & 0xFF); 
				data.push((minInterval >> 8) & 0xFF);
				var maxInterval = config.maxInterval ? config.maxInterval : 360;
				data.push(maxInterval & 0xFF);
				data.push((maxInterval >> 8) & 0xFF);
				var change = config.change;
				if (change) {
					for (var j=0; j<change.length; j++) {
						data.push(change[j]);
					}
				}
			}
			else {
				data.push(config.timeout & 0xFF);
				data.push((config.timeout >> 8) & 0xFF);
			}
		}
	}
	console.log("config reporting data: " + util.inspect(data));

	this._sendGeneralCommand(GeneralCommands.CONFIGURE_REPORTING, data, cb);
}


Cluster.prototype.discoverAttributes = function(start, max, cb) {
	//var startIdentifier = 0;
	//var maxIdentifiers = 5;

	var data = [];
	data.push(start & 0xFF);
	data.push((start >> 8) & 0xFF);
	data.push(max);
	
	console.log("discover attributes: " + util.inspect(data));

	this._sendGeneralCommand(GeneralCommands.DISCOVER_ATTRIBUTES, data, cb);
}


/**
 * Handle explicit message addressed from node/endpoint/cluster
 */
Cluster.prototype.handleRx = function(packet) {
	var data = packet.rawData;
	var frameControl = data[0];
	//var direction = (frameControl & 0x08); // 0: client to server; 1: server to client
	//var disableDefaultResponse = (frameControl & 0x10); // 0: send default response; 1: only send response if error
	
	if ((0x01 & frameControl) == 0x01) {
		// cluster-specific command
		this._handleClusterCommand(packet);
	}
	else {
		// Command acts across the entire profile
		this._handleGeneralCommand(packet);
	}
}

/**
 * Handle cluster-specific commands
 */
Cluster.prototype._handleClusterCommand = function(packet) {
	// TODO use the profile id and cluster id to parse the command and send the appropriate event

	console.log(">>> Rx cluster command for cluster " + packet.clusterId);
	switch(packet.clusterId) {
//		case ClusterId.OnOff:	
//			this._handleOnOff(packet);
//			break;
	}

}

/**
 * Handle general cross-cluster commands
 */
Cluster.prototype._handleGeneralCommand = function(packet) {
	var data = packet.rawData;
	var command = data[2];
	
	console.log(">>> Rx general command: " + GeneralCommandStrings[command]);
	
	switch(command) {
	
	case GeneralCommands.READ_ATTRIBUTES :
		break;
		
	case GeneralCommands.READ_ATTRIBUTES_RESPONSE:
		this._handleReadAttributesResponse(packet);
		break;
		
	case GeneralCommands.WRITE_ATTRIBUTES:
		this._handleWriteAttributes(packet);
		break;
		
	case GeneralCommands.WRITE_ATTRIBUTES_UNDIVIDED:
		break;
		
	case GeneralCommands.WRITE_ATTRIBUTES_RESPONSE:
		break;
		
	case GeneralCommands.WRITE_ATTRIBUTES_NO_RESPONSE:
		break;
		
	case GeneralCommands.CONFIGURE_REPORTING:
		break;
		
	case GeneralCommands.CONFIGURE_REPORTING_RESPONSE:
		break;
		
	case GeneralCommands.READ_REPORTING_CONFIG:
		break;
		
	case GeneralCommands.READ_REPORTING_CONFIG_RESPONSE:
		break;
		
	case GeneralCommands.REPORT_ATTRIBUTES:
		this._handleReportedAttributes(packet);
		break;
		
	case GeneralCommands.DEFAULT_RESPONSE:
		break;
		
	case GeneralCommands.DISCOVER_ATTRIBUTES:
		break;
		
	case GeneralCommands.DISCOVER_ATTRIBUTES_RESPONSE:
		break;
		
	case GeneralCommands.READ_ATTRIBUTES_STRUCTURED:
		break;
		
	case GeneralCommands.WRITE_ATTRIBUTES_STRUCTURED:
		break;
		
	case GeneralCommands.WRITE_ATTRIBUTES_STRUCTURED_RESPONSE:
		break;
		
	default:
		// error: unknown command
	}
}


Cluster.prototype._handleReadAttributesResponse = function(packet) {
	var data = packet.rawData;
	
	// parse attribute data
	var zclHeader = data[0];
	var attributeReports = [];
	for (var i=3; i<data.length; ) {
		var attribute = {};
		attribute.id = (data[i++] & 0xFF) | ((data[i++] << 8) & 0xFF00);
		attribute.type = data[i++];
		// the length of data depends on type
		attribute.data = [];
		var typeLength = DataTypeLengths[attribute.type];
		// TODO handle special dynamic length types
		for (var j=0; j<typeLength; j++) {
			attribute.data.push(data[i++] & 0xFF);
		}
		attributeReports.push(attribute);
	}
	var report = {
			address64: this.node.remote64.hex,
			endpoint: packet.sourceEndpoint,
			profileId: packet.profileId,
			clusterId: packet.clusterId,
			attributes: attributeReports
	}
	this.emit("attributeReport", report);
}

Cluster.prototype._handleWriteAttributes = function(packet) {
	var data = packet.rawData;
	//console.log("got attributes: " + JSON.stringify(data));
	var zclHeader = data[0];
	var attributeReports = [];
	for (var i=3; i<data.length; ) {
		var attribute = {};
		attribute.id = (data[i++] & 0xFF) | ((data[i++] << 8) & 0xFF00);
		attribute.type = data[i++];
		// the length of data depends on type
		attribute.data = [];
		var typeLength = DataTypeLengths[attribute.type];
		// TODO handle special dynamic length types
		for (var j=0; j<typeLength; j++) {
			attribute.data.push(data[i++] & 0xFF);
		}
		//console.log("attr: " + util.inspect(attribute));
		attributeReports.push(attribute);
	}
	var report = {
			address64: this.node.remote64.hex,
			endpoint: packet.sourceEndpoint,
			profileId: packet.profileId,
			clusterId: packet.clusterId,
			attributes: attributeReports
	}
	this.emit("attributeReport", report);
}

/**
 * Handle reported attributes
 */
Cluster.prototype._handleReportedAttributes = function(packet) {
	//console.log("got reported attributes");
	var data = packet.rawData;
	var zclHeader = data[0];
	var attributeReports = [];
	for (var i=3; i<data.length; ) {
		var attribute = {};
		attribute.id = (data[i++] & 0xFF) | ((data[i++] << 8) & 0xFF00);
		attribute.type = data[i++];
		// the length of data depends on type
		attribute.data = [];
		var typeLength = DataTypeLengths[attribute.type];
		// TODO handle special dynamic length types
		for (var j=0; j<typeLength; j++) {
			attribute.data.push(data[i++] & 0xFF);
		}
		//console.log("attr: " + util.inspect(attribute));
		attributeReports.push(attribute);
	}
	var report = {
			address64: this.node.remote64.hex,
			endpoint: packet.sourceEndpoint,
			profileId: packet.profileId,
			clusterId: packet.clusterId,
			attributes: attributeReports
	}
	this.emit("attributeReport", report);
}




/* ------------------------- Identity : Cluster ID 0x0003 ------------------------ */

Cluster.prototype.identify = function(seconds, cb) {
	var sourceEndpoint = 0x00;
	
	var command = 0x00;		// identify
	var time = [ (seconds & 0xFF), (seconds >> 8) & 0xFF];
	
	var data = new Buffer([ frameControl, this.zbee._getTxnId(), command, time[0], time[1] ]);

	//this.node.sendZclCommand(clusterId, profileId, sourceEndpoint, endpoint, data, cb);
	
	this._sendClusterCommand(GeneralCommands.DISCOVER_ATTRIBUTES, data, cb);

}

/* ----------------------------- On/Off : Cluster ID 0x006 ------------------------------------ */

Cluster.prototype.sendOnOff = function(value, cb) {
	//console.log("sending On/Off Request");
	var frameControl = 0x01;	// specific to cluster
	var clusterId = 0x0006		// On/Off
	var profileId = 0x0104;		// HA
	var sourceEndpoint = 0x00;
	
	var val = value ? 0x01 : 0x00;
	var data = new Buffer([ frameControl, this.zbee._getTxnId(), val, 0x00, 0x00 ]);

	this.node.sendZclCommand(clusterId, profileId, sourceEndpoint, this.endPoint, data, cb);
}
















var Attribute = exports.Attribute = function(cluster, id, type, value) {
	this.cluster = cluster;
	this.id = id;
	this.type = type;
	this.value = value;
}







var ZclFrame = function() {
	
}

ZclFrame.prototype.toBytes = function() {
	return 0x09;
}


/* general command frames */
var GeneralCommands = exports.GeneralCommands = {
	READ_ATTRIBUTES                      : 0x00,
	READ_ATTRIBUTES_RESPONSE             : 0x01,
	WRITE_ATTRIBUTES                     : 0x02,
	WRITE_ATTRIBUTES_UNDIVIDED           : 0x03,
	WRITE_ATTRIBUTES_RESPONSE            : 0x04,
	WRITE_ATTRIBUTES_NO_RESPONSE         : 0x05,
	CONFIGURE_REPORTING                  : 0x06,
	CONFIGURE_REPORTING_RESPONSE         : 0x07,
	READ_REPORTING_CONFIG                : 0x08,
	READ_REPORTING_CONFIG_RESPONSE       : 0x09,
	REPORT_ATTRIBUTES                    : 0x0a,
	DEFAULT_RESPONSE                     : 0x0b,
	DISCOVER_ATTRIBUTES                  : 0x0c,
	DISCOVER_ATTRIBUTES_RESPONSE         : 0x0d,
	READ_ATTRIBUTES_STRUCTURED           : 0x0e,
	WRITE_ATTRIBUTES_STRUCTURED          : 0x0f,
	WRITE_ATTRIBUTES_STRUCTURED_RESPONSE : 0x10,
};

var GeneralCommandStrings = exports.GeneralCommandStrings = {
	0x00: "Read attributes",
	0x01: "Read attributes response",
	0x02: "Write attributes",
	0x03: "Write attributes undivided",
	0x04: "Write attributes response",
	0x05: "Write attributes no response",
	0x06: "Configure reporting",
	0x07: "Configure reporting response",
	0x08: "Read reporting configuration",
	0x09: "Read reporting configuration response",
	0x0a: "Report attributes",
	0x0b: "Default response",
	0x0c: "Discover attributes",
	0x0d: "Discover attributes response",
	0x0e: "Read attributes structured",
	0x0f: "Write attributes structured",
	0x10: "Write attributes structured response",
};


/**
 * Lengths of data types, in bytes/octets
 */
var DataTypeLengths = {

	// Null
	0x00: 0,		// No data
	
	// General data : discrete
	0x08: 1,		// 8-bit data 
	0x09: 2, 		// 16-bit data 
	0x0a: 3,		// 24-bit data
	0x0b: 4,		// 32-bit data
	0x0c: 5,		// 40-bit data
	0x0d: 6,		// 48-bit data
	0x0e: 7,		// 56-bit data
	0x0f: 8,		// 64-bit data
	
	// Logical : discrete
	0x10: 1,		// Boolean.  Invalid = 0xff
	
	// Bitmap : discrete
	0x18: 1,		// 8-bit bitmap
	0x19: 2,		// 16-bit bitmap
	0x1a: 3,		// 24-bit bitmap
	0x1b: 4,		// 32-bit bitmap
	0x1c: 5,		// 40-bit bitmap
	0x1d: 6,		// 48-bit bitmap
	0x1e: 7,		// 56-bit bitmap
	0x1f: 8, 		// 64-bit bitmap
	
	// Unsigned integer : analogue
	0x20: 1,		// Unsigned 8-bit integer.   invalid : 0xff
	0x21: 2,		// Unsigned 16-bit integer.  invalid : 0xffff
	0x22: 3,		// Unsigned 24-bit integer.  invalid : 0xffffff
	0x23: 4, 		// Unsigned 32-bit integer.  invalid : 0xffffffff
	0x24: 5,		// Unsigned 40-bit integer.  invalid : 0xffffffffff
	0x25: 6,		// Unsigned 48-bit integer.  invalid : 0xffffffffffff
	0x26: 7,		// Unsigned 56-bit integer.  invalid : 0xffffffffffffff
	0x27: 8,		// Unsigned 64-bit integer.  invalid : 0xffffffffffffffff
	
	// Signed integer : analogue
	0x28: 1,		// Signed 8-bit integer.   invalid : 0x80
	0x29: 2,		// Signed 16-bit integer.  invalid : 0x8000
	0x2a: 3,		// Signed 24-bit integer.  invalid : 0x800000
	0x2b: 4,		// Signed 32-bit integer.  invalid : 0x80000000
	0x2c: 5,		// Signed 40-bit integer.  invalid : 0x8000000000
	0x2d: 6,		// Signed 48-bit integer.  invalid : 0x800000000000
	0x2e: 7,		// Signed 56-bit integer.  invalid : 0x80000000000000
	0x2f: 8,		// Signed 64-bit integer.  invalid : 0x8000000000000000

	// Enumeration: discrete
	0x30: 1,		// 8-bit enumeration.   invalid : 0xff
	0x31: 2,		// 16-bit enumeration.  invalid : 0xffff

	// Floating point : analogue
	0x38: 2,		// Semi-precision.    invalid : Not a Number
	0x39: 4,		// Single precision.  invalid : Not a Number
	0x3a: 8,		// Double precision.  invalid : Not a Number

	// String : discrete
	0x41: 0xFF, 	// Octet string.          length : Defined in first octet.       invalid : 0xff in first octet
	0x42: 0xFF,		// Character string.      length : Defined in first octet.       invalid : 0xff in first octet
	0x43: 0xFF,		// Long octet string.     length : Defined in first two octets.  invalid : 0xffff in first two octets
	0x44: 0xFF,		// Long character string. length : Defined in first two octets.  invalid : 0xffff in first two octets

	// Ordered sequence : discrete
	0x48: 0xFF,		// Array.       length : 2 + sum of lengths of contents.  invalid : 0xffff in first 2 octets
	0x4c: 0xFF,		// Structure.   length : 2 + sum of lengths of contents.  invalid : 0xffff in first 2 octets

	// Collection : discrete
	0x50: 0xFF,		// Set.   length : Sum of lengths of contents.  invalid : Number of elements returned as 0xffff
	0x51: 0xFF,		// Bag.   length : Sum of lengths of contents.  invalid : Number of elements returned as 0xffff

	// Time : analogue
	0xe0: 4,		// Time of day.   invalid : 0xffffffff
	0xe1: 4,		// Date.          invalid : 0xffffffff
	0xe2: 4,		// UTCTime.       invalid : 0xffffffff
	
	// Identifier : discrete
	0xe8: 2, 		// Cluster ID.    invalid : 0xffff
	0xe9: 2,		// Attribute ID.  invalid : 0xffff
	0xea: 4,		// BACnet OID.    invalid : 0xffffffff
	
	// Miscellaneous : discrete
	0xf0: 8,		// IEEE address.  invalid = 0xffffffffffffffff
	0xf1: 16,		// 128-bit security key
	
	// Unknown
	0xff: 0,		// Unknown 
}

/**
 * ZCL status values
 */
var ZclStatusValue = {
	SUCCESS                     : 0x00,
	FAILURE                     : 0x01,
	NOT_AUTHORIZED              : 0x7e,
	RESERVED_FIELD_NOT_ZERO     : 0x7f,
	MALFORMED_COMMAND           : 0x80,
	UNSUP_CLUSTER_COMMAND       : 0x81,
	UNSUP_GENERAL_COMMAND       : 0x82,
	UNSUP_MANUF_CLUSTER_COMMAND : 0x83,
	UNSUP_MANUF_GENERAL_COMMAND : 0x84,
	INVALID_FIELD               : 0x85,
	UNSUPPORTED_ATTRIBUTE       : 0x86,
	INVALID_VALUE               : 0x87,
	READ_ONLY                   : 0x88,
	INSUFFICIENT_SPACE          : 0x89,
	DUPLICATE_EXISTS            : 0x8a,
	NOT_FOUND                   : 0x8b,
	UNREPORTABLE_ATTRIBUTE      : 0x8c,
	INVALID_DATA_TYPE           : 0x8d,
	INVALID_SELECTOR            : 0x8e,
	WRITE_ONLY                  : 0x8f,
	INCONSISTENT_STARTUP_STATE  : 0x90,
	DEFINED_OUT_OF_BAND         : 0x91,
	INCONSISTENT                : 0x92,
	ACTION_DENIED               : 0x93,
	TIMEOUT                     : 0x94,
	ABORT                       : 0x95,
	INVALID_IMAGE               : 0x96,
	WAIT_FOR_DATA               : 0x97,
	NO_IMAGE_AVAILABLE          : 0x98,
	REQUIRE_MORE_IMAGE          : 0x99,
	HARDWARE_FAILURE            : 0xc0,
	SOFTWARE_FAILURE            : 0xc1,
	CALIBRATION_ERROR           : 0xc2,
};

/**
 * Strings for ZCL status values
 */
var ZclStatusStrings = {};
ZclStatusStrings[ZclStatusValue.SUCCESS]                     = "Operation was successful.";
ZclStatusStrings[ZclStatusValue.FAILURE]                     = "Operation was not successful.";
ZclStatusStrings[ZclStatusValue.NOT_AUTHORIZED]              = "The sender of the command does not have authorization to carry out this command.";
ZclStatusStrings[ZclStatusValue.RESERVED_FIELD_NOT_ZERO]     = "A reserved field/subfield/bit contains a non-zero value.";
ZclStatusStrings[ZclStatusValue.MALFORMED_COMMAND]           = "The command appears to contain the wrong fields, as detected either by the presence of one or more invalid field entries or by there being missing fields. Command not carried out. Implementer has discretion as to whether to return this error or INVALID_FIELD.";
ZclStatusStrings[ZclStatusValue.UNSUP_CLUSTER_COMMAND]       = "The specified cluster command is not supported on the device. Command not carried out.";
ZclStatusStrings[ZclStatusValue.UNSUP_GENERAL_COMMAND]       = "The specified general ZCL command is not supported on the device.";
ZclStatusStrings[ZclStatusValue.UNSUP_MANUF_CLUSTER_COMMAND] = "A manufacturer specific unicast, cluster specific command was received with an unknown manufacturer code, or the manufacturer code was recognized but the command is not supported.";
ZclStatusStrings[ZclStatusValue.UNSUP_MANUF_GENERAL_COMMAND] = "A manufacturer specific unicast, ZCL specific command was received with an unknown manufacturer code, or the manufacturer code was recognized but the command is not supported.";
ZclStatusStrings[ZclStatusValue.INVALID_FIELD]               = "At least one field of the command contains an incorrect value, according to the specification the device is implemented to.";
ZclStatusStrings[ZclStatusValue.UNSUPPORTED_ATTRIBUTE]       = "The specified attribute does not exist on the device.";
ZclStatusStrings[ZclStatusValue.INVALID_VALUE]               = "Out of range error, or set to a reserved value. Attribute keeps its old value.";
ZclStatusStrings[ZclStatusValue.READ_ONLY]                   = "Attempt to write a read only attribute.";
ZclStatusStrings[ZclStatusValue.INSUFFICIENT_SPACE]          = "An operation (e.g. an attempt to create an entry in a table) failed due to an insufficient amount of free space available.";
ZclStatusStrings[ZclStatusValue.DUPLICATE_EXISTS]            = "An attempt to create an entry in a table failed due to a duplicate entry already being present in the table.";
ZclStatusStrings[ZclStatusValue.NOT_FOUND]                   = "The requested information (e.g. table entry) could not be found.";
ZclStatusStrings[ZclStatusValue.UNREPORTABLE_ATTRIBUTE]      = "Periodic reports cannot be issued for this attribute.";
ZclStatusStrings[ZclStatusValue.INVALID_DATA_TYPE]           = "The data type given for an attribute is incorrect. Command not carried out.";
ZclStatusStrings[ZclStatusValue.INVALID_SELECTOR]            = "The selector for an attribute is incorrect.";
ZclStatusStrings[ZclStatusValue.WRITE_ONLY]                  = "A request has been made to read an attribute that the requestor is not authorized to read. No action taken.";
ZclStatusStrings[ZclStatusValue.INCONSISTENT_STARTUP_STATE]  = "Setting the requested values would put the device in an inconsistent state on startup. No action taken.";
ZclStatusStrings[ZclStatusValue.DEFINED_OUT_OF_BAND]         = "An attempt has been made to write an attribute that is present but is defined using an out-of-band method and not over the air.";
ZclStatusStrings[ZclStatusValue.INCONSISTENT]                = "The supplied values (e.g. contents of table cells) are inconsistent.";
ZclStatusStrings[ZclStatusValue.ACTION_DENIED]               = "The credentials presented by the device sending the command are not sufficient to perform this action.";
ZclStatusStrings[ZclStatusValue.TIMEOUT]                     = "The exchange was aborted due to excessive response time.";
ZclStatusStrings[ZclStatusValue.ABORT]                       = "Failed case when a client or a server decides to abort the upgrade process.";
ZclStatusStrings[ZclStatusValue.INVALID_IMAGE]               = "Invalid OTA upgrade image (ex. failed signature validation or signer information check or CRC check).";
ZclStatusStrings[ZclStatusValue.WAIT_FOR_DATA]               = "Server does not have data block available yet.";
ZclStatusStrings[ZclStatusValue.NO_IMAGE_AVAILABLE]          = "No OTA upgrade image available for a particular client.";
ZclStatusStrings[ZclStatusValue.REQUIRE_MORE_IMAGE]          = "The client still requires more OTA upgrade image files in order to successfully upgrade.";
ZclStatusStrings[ZclStatusValue.HARDWARE_FAILURE]            = "An operation was unsuccessful due to a hardware failure.";
ZclStatusStrings[ZclStatusValue.SOFTWARE_FAILURE]            = "An operation was unsuccessful due to a software failure.";
ZclStatusStrings[ZclStatusValue.CALIBRATION_ERROR]           = "An error occurred during calibration.";