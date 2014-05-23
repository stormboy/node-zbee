/**
 * NeDB version of storage for Nodes and Endpoints.
 */

var util         = require('util');
var EventEmitter = require("events").EventEmitter;
var NeDB         = require('nedb');
var Tools        = require("svd-xbee").Tools;

/**
 * Constructor
 */
var DataStore = exports.DataStore = function(options) {
	EventEmitter.call(this);

	var dbPath = options.path || (__dirname+'/../data/');
	var inMemory = typeof options['transient'] === "undefined" ? false : options['transient'];
	this.db = {};
	this.db.nodes     = new NeDB({ filename: dbPath + 'nodes.db', inMemoryOnly: inMemory });
	this.db.devices = new NeDB({ filename: dbPath + 'devices.db', inMemoryOnly: inMemory });
	this.db.bindings  = new NeDB({ filename: dbPath + 'bindings.db', inMemoryOnly: inMemory });

	this._init()
}

util.inherits(DataStore, EventEmitter);

/**
 * Initialise the DataStore object
 */
DataStore.prototype._init = function() {
	console.log("datastore initialising");
	
	var self = this;
	
	this.db.nodes.loadDatabase(function (err) { 
		self.db.nodes.ensureIndex({ fieldName: 'address64', unique: true });
		self.db.nodes.ensureIndex({ fieldName: 'address16' });
	});
	
	this.db.devices.loadDatabase(function (err) {
		self.db.devices.ensureIndex({ fieldName: 'id', unique: true }, function (err) {});
	});
	
	this.db.bindings.loadDatabase(function (err) {
	});

	this.emit("ready");
}

DataStore.prototype.close = function() {
        this.db.nodes.close();
        this.db.devices.close();
        this.db.bindings.close();
}

/**
 * Persist a node in the database
 */
DataStore.prototype.persistNode = function(node, cb) {
	//console.log("persisting node " + node.remote64.hex);
	var timestamp = new Date();
	var self = this;
	self.db.nodes.find({ address64: node.remote64.hex}, function(err, docs) {
		if (err) {
			console.log("!!! error persisting node: " + err);
		}
		var nodeDoc = node.toDesc();
		nodeDoc.updated = timestamp
		if (docs.length == 0) {
			self.db.nodes.insert(nodeDoc, function (err, newDoc) {
				if (typeof cb != 'undefined') {
					cb(err, newDoc);
				}
			});
		}
		else {
			var doc = docs[0];
			self.db.nodes.update({ address64: node.remote64.hex}, { $set: nodeDoc }, {}, function(err, numReplaced, upsert) {
				if (typeof cb != 'undefined') {
					cb(err, nodeDoc);
				}
			});
		}
	});
}

/**
 * Get all nodes
 */
DataStore.prototype.getNodes = function(cb) {
	this.db.nodes.find({}, function(err, docs) {
		//console.log("got docs: " + util.inspect(docs));
		cb(err, docs);
	});
}

/**
 * Get a node that matches the 64 bit IEEE address
 */
DataStore.prototype.getNodeByAddress64 = function(address64, cb) {
	if (typeof address64 == 'Array') {
		// make sure address is hex-string format
		address64 = Tools.bArr2HexStr(address64);
	}
	this.db.nodes.find({ address64: address64}, function(err, docs) {
		if (docs.length > 0) {
			cb(null, docs[0]);
		}
		else {
			cb(new Error("Node " + address64 + " not found"));
		}
	});
}

/**
 * Get a node that matches the 16bit address
 */
DataStore.prototype.getNodeByAddress16 = function(address16, cb) {
	if (typeof address16 == 'Array') {
		// make sure address is hex-string format
		address16 = Tools.bArr2HexStr(address16);
	}
	this.db.nodes.find({ address16: address16}, function(err, docs) {
		if (docs.length > 0) {
			cb(null, docs[0]);
		}
		else {
			cb(new Error("not found"));
		}
	});
}

DataStore.prototype.persistApplication = function(application, cb) {
	var timestamp = new Date();
	var self = this;
	var id = application.address64 + "." + Tools.dec2Hex(application.endpoint, 2);
	self.db.devices.find({ id: id }, function(err, docs) {
		if (err) {
			console.log("!!! error persisting endpoint: " + err);
		}
		var applicationDoc =  application;
		if (application.node) {
			applicationDoc = application.toSpec();
		}
		//application.id = id;
		//application.updated = timestamp;
		applicationDoc.id = id;
		applicationDoc.updated = timestamp;
		
//		{
//				id            : id,
//				address16     : application.address16,		// node address
//			    endpoint      : application.endpoint,
//				profileId     : application.profileId,
//				deviceId      : application.deviceId,
//				deviceVersion : application.deviceVersion,
//				inputClusters : application.inputClusters,
//				outputClusters : application.outputClusters,
//				updated       : timestamp,
//			};
		if (docs.length == 0) {
			self.db.devices.insert(applicationDoc, function (err, newDoc) {
				if (typeof cb != 'undefined') {
					cb(err, newDoc);
				}
			});
		}
		else {
			//var doc = docs[0];
			self.db.devices.update({ id: id }, { $set: applicationDoc }, {}, function(err, numReplaced, upsert) {
				if (typeof cb != 'undefined') {
					cb(err, applicationDoc);
				}
			});
		}
	});
}

/**
 * Get devices
 */
DataStore.prototype.getDevices = function(filter, cb) {
	if (typeof filter == 'function') {
		cb = filter;
		fiter = {};
	}
	this.db.devices.find(filter, function(err, docs) {
		cb(err, docs);
	});
}


