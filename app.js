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

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
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

coordinator.on("node", function(node) {
	var data =   {
	    remote16   : node.remote16,
	    remote64   : node.remote64,
	    id         : node.id,
	    deviceType : node.deviceType
	};
	
	sio.sockets.emit('node', data);
});
coordinator.on("init", function(node) {
	coordinator.getNodes(function(err, nodes) {
		for (var i=0; i<nodes.length; i++) {
			var node = nodes[i];
			console.log("got stored node: " + stringify(node));
		}
	});
});
	
sio.sockets.on('connection', function (socket) {
	console.log('A socket connected!');
	
	socket.on('command', function (cmd, data) {
		console.log('I received a command: ', cmd, ', data: ', data);
		switch (cmd) {
			case "id":
				coordinator.setId(data);
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
		}
	});
	socket.on('at', function (command) {
		console.log('I received a an AT command: ', command);
		coordinator.at(command);
	});
	
	socket.on('disconnect', function () {
		sio.sockets.emit('user disconnected');
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


