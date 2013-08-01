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
  console.log('Express server listening on port ' + app.get('port'));
});

// create new XBee HA coordinator
var coordinator = new Coordinator(config);

// handle ZB coordinator initialisation
coordinator.on("init", function() {
	coordinator.getNodes(function(err, nodes) {
		for (var i=0; i<nodes.length; i++) {
			var node = nodes[i];
			//console.log("got stored node: " + stringify(node));
			sio.sockets.emit('node', node);
		}
	});
	coordinator.getApplications(function(err, applications) {
		for (var i=0; i<applications.length; i++) {
			var application = applications[i];
			//console.log("got stored application: " + stringify(application));
			sio.sockets.emit('application', application);
		}
	});
});

// handle node discovery
coordinator.on("node", function(node) {
	sio.sockets.emit('node', node.toDesc());
	sio.sockets.emit('nodeHealth', { address64: node.remote64.hex, status: "alive" });
});

// handle application discovery
coordinator.on("application", function(application) {
	if (application) {
		
		if (application.node) {
			application = application.toSpec();
		}
		sio.sockets.emit('application', application);
	}
	else {
		console.log("why no application object??");
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
	coordinator.getNodes(function(err, nodes) {
		for (var i=0; i<nodes.length; i++) {
			var node = nodes[i];
			//console.log("got stored node: " + stringify(node));
			socket.emit('node', node);
		}
	});
	// send applications to client
	coordinator.getApplications(function(err, applications) {
		for (var i=0; i<applications.length; i++) {
			var application = applications[i];
			//console.log("got stored application: " + stringify(application));
			socket.emit('application', application);
		}
	});

	// listen for commands fom the client
	socket.on('command', function (cmd, data) {
		console.log('I received a command: ', cmd, ', data: ', data);
		switch (cmd) {
			case "id":
				coordinator.setId(data);
				break;
			case "configure":
				coordinator.configure();
				break;
			case "save":
				coordinator.save();
				break;
			case "reset":
				coordinator.reset();
				break;
			case "join":
				coordinator.allowJoin();
				break;
			case "leave":
				coordinator.leave();
				break;
			case "discover":
				coordinator.discover();
				break;
			case "association":
				coordinator.checkAssociation();
				break;
			case "test":
				coordinator.test();
				break;
				
			case "queryAddresses":
				coordinator.queryAddresses();
				break;
				
			case "identify":
				coordinator.identifyNode(data.address64, data.endpoint);
				break;
			case "addBinding":
				coordinator.addBinding(data);
				break;
			case "discoverAttributes":
				coordinator.discoverAttributes(data.address64, data.endpoint, data.clusterId, data.start, data.max);
				break;
			case "configReporting":
				coordinator.configReporting(data.address64, data);
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


