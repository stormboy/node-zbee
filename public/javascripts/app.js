define([
	'jquery',
	'backbone',
	'router',
	'socketio',
	'bootstrap',
], 
function($, Backbone, Router, io) {
	var self = this;
	
	/**
	 * Socket.io socket.
	 */
	this.socket = null;

	/**
	 * Initialise function
	 */
	this.initialize = function() {
		$( document ).ready(function() {
			var socket = self.socket = io.connect();

			var nodes = {};			// map of address64 to endpoint
			var endpoints = {};			// map of _id to endpoint
			socket.on('node', function (spec) {
				var existing = nodes[spec.remote64.hex];
				if (!existing) {
					console.log("got node: " + JSON.stringify(spec));
					nodes[spec.remote64.hex] = spec;
				}
			});
			socket.on('device', function (spec) {
				var existing = endpoints[spec.id];
				if (!existing) {
					console.log("got device: " + JSON.stringify(spec));
					endpoints[spec.id] = spec;
				}
			});
//			socket.on('lifecycle', function (data) {
//				var node = nodes[data.address64.hex];
//				if (node) {
//					var background = data.state == "alive" ? "#FFF" : "#ccc"
//					$("#nodes #" + data.address64.hex).css("background-color", background);
//				}
//			});
		    
			Router.initialize(socket);
		});
	}

	return this;
});
