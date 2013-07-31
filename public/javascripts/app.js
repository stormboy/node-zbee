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
			Router.initialize(socket);

			// map of address64 to endpoint
			var nodes = {};
			
			// map of _id to endpoint
			var endpoints = {};
			
			socket.on('node', function (spec) {
				//console.log("got node: " + JSON.stringify(spec));
				//data.address64
				
				var existing = nodes[spec.remote64.hex];
				if (!existing) {
					nodes[spec.remote64.hex] = spec;
					$("#nodes").append("<div id='" + spec.remote64.hex + "' style='margin-top: 10px; background-color: #666'>" + JSON.stringify(spec) + "</div>");
				}
			});

			socket.on('application', function (spec) {
				//console.log("got application: " + JSON.stringify(spec));
				var existing = endpoints[spec.id];
				if (!existing) {
					endpoints[spec.id] = spec;
					$("#applications").append("<div id='" + spec.id + "' style='margin-top: 10px'>" + JSON.stringify(spec) + "</div>");
				}
			});

			socket.on('lifecycle', function (data) {
				//console.log("git lifecycle : " + JSON.stringify(data));
				var node = nodes[data.address64.hex];
				if (node) {
					var background = data.state == "alive" ? "#FFF" : "#ccc"
					$("#nodes #" + data.address64.hex).css("background-color", background);
				}
			});
			
			// highlight appropriate menu item
			// TODO listen to router
//            $(function(){
//                var path = window.location.pathname;
//                $('.nav li a[href="'+path+'"]').parents('li').addClass('active');
//              });
		    
		});
	}

	return this;
});
