/**
 * TODO
 * - send previously discovered nodes to client
 * - send device health status (i.e. whether online) to client
 */

/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , io = require('socket.io');
var config = require('./config');
var Coordinator = require("./lib/coordinator").Coordinator;

var app = express();

app.locals.basepath = config.basePath;  // set basepath variable

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);


var server = http.createServer(app);
var sio = io.listen(server);
sio.set('log level', 2);

server.listen(app.get('port'), function(){
  console.log('Zigbee manager server listening on port ' + app.get('port'));
});

// create new XBee HA coordinator
var coordinator = new Coordinator(config);

// handle ZB coordinator initialisation
coordinator.on("init", function() {
	console.log("--- received init from coordinator");
	coordinator.getStoredNodes(function(err, nodes) {
		for (var i=0; i<nodes.length; i++) {
			var node = nodes[i];
			//console.log("got stored node: " + stringify(node));
			sio.sockets.emit('node', node);
		}
	});
	coordinator.getStoredDevices(function(err, devices) {
		for (var i=0; i<devices.length; i++) {
			var device = devices[i];
			//console.log("got stored device: " + stringify(device));
			sio.sockets.emit('device', device);
		}
	});
});

// handle node discovery
coordinator.on("node", function(node) {
	sio.sockets.emit('node', node.toDesc());
	sio.sockets.emit('lifecycle', { address64: node.remote64.hex, state: "alive" });
});

// handle devices/application-object discovery
coordinator.on("device", function(device) {
	if (device) {
		
		if (device.node) {
			device = device.toSpec();
		}
		sio.sockets.emit('device', device);
	}
	else {
		console.log("why no device/application object??");
	}
});

coordinator.zbee.on("lifecycle", function(address64, state) {
	sio.sockets.emit('lifecycle', {
		address64 : address64,
		state : state,
	});
});

/**
 * cluster message
 */
//coordinator.on("explicit", function(message) {
//	sio.sockets.emit("explicit", message);
//});

/**
 * Report on cluster attributes
 */
coordinator.on("attributeReport", function(message) {
	sio.sockets.emit("attributeReport", message);
});

// handle a client socket connection
sio.sockets.on('connection', function (socket) {
	console.log('A client socket connected!');

	// send nodes to client
	coordinator.getStoredNodes(function(err, nodes) {
		for (var i=0; i<nodes.length; i++) {
			var node = nodes[i];
			socket.emit('node', node);
		}
	});
	// send devices to client
	coordinator.getStoredDevices(function(err, devices) {
		for (var i=0; i<devices.length; i++) {
			var device = devices[i];
			socket.emit('device', device);
		}
	});

	// listen for commands from the client
	socket.on('command', function (cmd, data) {
		console.log('received command: ', cmd, ', data: ', data);
		
		switch (cmd) {
		
		case "discover":
			// Discover Zigbee nodes and Zigbee devices on the network.
			// Not yet implemented properly
			coordinator.discover();
			break;
			
		case "discoverNodeEndpoints":
			// make a Zigbee devices notify itself
			coordinator.discoverNodeEndpoints(data.address64);
			break;
			
		case "identify":
			// make a Zigbee devices notify itself
			coordinator.identifyDevice(data.address64, data.endpoint);
			break;
			
		case "configReporting":
			// configure reporting of attributes to the local node
			coordinator.configReporting(data.address64, data);
			break;
			
		case "addBinding":
			// add binding between clusters on different ZigBee devices.
			coordinator.addBinding(data);
			break;
			
		case "discoverAttributes":
			// Find attributes on a particular cluster
			coordinator.discoverAttributes(data.address64, data.endpoint, data.clusterId, data.start, data.max);
			break;

		case "configure":
			// Configure the XBee for HA
			coordinator.configure();
			break;
		case "save":
			// Write XBee settings to flash
			coordinator.save();
			break;
		case "reset":
			// Reset XBee settings to factory default
			coordinator.reset();
			break;
			
		case "join":
			// Allow new nodes to join the network.
			coordinator.allowJoin();
			break;
		case "leave":
			// Make the Zbee leave the network
			coordinator.leave();
			break;
			
		case "association":
			// Check the network association state on the local Node.
			coordinator.checkAssociation();
			break;
			
		case "test":
			coordinator.test();
			break;
			
		case "queryAddresses":
			coordinator.queryAddresses();
			break;
		}
	});
	
	// node setup
	socket.on('node', function (nodeAddress, cmd, data) {
		console.log('received node command: ' + nodeAddress + " : " + cmd + ' : ', data);
		switch (cmd) {

		// configure reporting for attribute (node,endpoint,cluster,attributeId)
		case "report":
			coordinator.configReporting();
			
			// lookup node
			// get cluster
			var node = coordinator.getNode(nodeAddress);
			if (node) {
				console.log("got node, now getting cluster")
				node.devices[endpoint];
				node.getDevice(endpoint);
			}
			break;

		case "unreport":
			break;
			
		case "bind":
			var binding = data;
//			 var binding = {
//				sourceAddress: byte[8]
//				sourceEndpoint: int(1)
//				clusterId: int(2)
//				type: BindingType
//				destAddress: byte[8]
//				destEndpoint: int(1)
//			};
			coordinator.addBinding(binding);

			//node.zdo.requestBind(binding);

			break;
			
		case "unbind":
			break;
		}
	});

	// node|endpoint|cluster : method, 
	socket.on('facet', function (nodeAddress, facet, method, args) {
		console.log('received facet message: ', nodeAddress + ': ' + data);
		
		switch (cmd) {
		
		case "value":
			break;
		}
	});
	
	// listen for AT command from client
	socket.on('at', function (command) {
		console.log('I received a an AT command: ', command);
		coordinator.at(command);
	});

	// handle client disconnection
	socket.on('disconnect', function () {
		sio.sockets.emit('client socket disconnected');
	});
});

var stringify = function(o) {
	var cache = [];
	var s = JSON.stringify(o, function(key, value) {
	    if (typeof value === 'object' && value !== null) {
	        if (cache.indexOf(value) !== -1) {
	            // Circular reference found, discard key
	            return;
	        }
	        // Store value in our collection
	        cache.push(value);
	    }
	    return value;
	});
	cache = null;
	return s;
}


