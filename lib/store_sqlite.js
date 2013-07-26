/**
 * Note this has not been developed!!!
 */

var util = require('util');
var EventEmitter = require("events").EventEmitter;
var sqlite3 = require('sqlite3').verbose();

var DataStore = function() {
	EventEmitter.call(this);

	var dbPath = options.db || 'nodes.db';

	this.statements = {};
	this.db = new sqlite3.Database(dbPath);
	this._init()
}

util.inherits(DataStore, EventEmitter);


DataStore.prototype._init = function() {
	var self = this;


	// setup database
	this.db.serialize(function() {
		self.db.run("CREATE TABLE IF NOT EXISTS node (id INTEGER PRIMARY KEY ASC, addr64 TEXT , addr16 TEXT)");
		self.db.run("CREATE TABLE IF NOT EXISTS endpoint (id INTEGER PRIMARY KEY ASC, node_id INT, endpoint_id INT, profile_id INT, device_id INT)");
		self.db.run("CREATE TABLE IF NOT EXISTS cluster (id INTEGER PRIMARY KEY ASC, endpoint_id INT, cluster_id INT, direction INT)");
		//self.db.run("CREATE TABLE IF NOT EXISTS attribute (id INTEGER PRIMARY KEY ASC, tz TEXT DEFAULT 'UTC', path TEXT, unit TEXT, value TEXT)");
	});

	this.db.run("CREATE INDEX IF NOT EXISTS index_addr64 ON node (addr64)");
	this.db.run("CREATE INDEX IF NOT EXISTS index_endpoint_node ON endpoint (node_id)");
	this.db.run("CREATE INDEX IF NOT EXISTS index_cluster_endpoint ON cluster (endpoint_id)");
	
	// create prepared statements
	this.statements.insertNode = this.db.prepare("INSERT INTO node (addr64, addr16) VALUES (?, ?)");
	this.statements.insertEndpoint = this.db.prepare("INSERT INTO endpoint (node_id, endpoint_id, profile_id, device_id) VALUES (?, ?, ?, ?)");
	this.statements.insertCluster = this.db.prepare("INSERT INTO cluster (endpoint_id, cluster_id, direction) VALUES (?, ?, ?)");

	this.statements.selectNode = this.db.prepare("SELECT * FROM node WHERE addr64 = ?");
	this.statements.selectNodeEndpoints = this.db.prepare("SELECT * FROM endpoint WHERE node_id = ?");
	this.statements.selectEndpointClusters = this.db.prepare("SELECT * FROM cluster WHERE endpoint_id = ?");

	this.emit("ready");
}

DataStore.prototype.close = function() {
        this.insertStatement.finalize();
        this.selectStatement.finalize();
        this.countStatement.finalize();
        this.db.close();
}

DataStore.prototype.storeNode = function(node) {
	var value = node.addr;
	var unit = data.unit || null;
	var timestamp = data.timestamp || new Date();
	this.insertStatement.run(path, value, unit, timestamp);
}

/**
 * 
 */
DataStore.prototype.getNode = function(addr, cb) {
	//this.countStatement.each(path, from, to, callback);
	//this.selectStatement.each(path, from, to, offset, max, callback, complete);
	
	cb(new Error("Not yet implemented"), null);
}