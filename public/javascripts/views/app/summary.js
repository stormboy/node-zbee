define(['jquery', 
        'underscore', 
        'backbone', 
   		'jade!templates/app/summary' ], 
   function($, _, Backbone, AppTemplate) {
   	
   	var AppView = Backbone.View.extend({
   		//el : $("#content"),

   		initialize : function() {
   			//console.log("initialising App view");
   		},
   		
   		model : {
   			title : "Hello"
   		},
   		
   		render: function () { 
   			var compiledTemplate = AppTemplate(this.model.toJSON());
   			this.$el.html(compiledTemplate);
   			return this;
   		},
   		
		events: { 
			"click .identify"      : "doIdentify",
			"click .listen"      : "doListen",
			"click .bind"      : "doBind",
		},
		
		doIdentify: function(event) {
			socket.emit("command", "identify", { address64: this.model.get("address64"), endpoint: this.model.get("endpoint") });
		},
		
		doListen: function(event) {
			var sender = (event && event.target) || (window.event && window.event.srcElement);
			var clusterId = sender.id.substring(7);

	    	socket.emit("command", "configReporting", {
	    		address64 : this.model.get("address64"),
	    		endpoint : this.model.get("endpoint"),
	    		clusterId : clusterId,
	    		configs : [{
		    		direction: 0x00,
		    		id: 0x0000,
		    		type: 0x10,		// boolean
		    		minInterval: 0x0000,
		    		maxInterval: 0x0000,
		    		//change: [0x00]		// only for analog types
		    	}]
		    });

		},
		
		doBind: function(event) {
			var sender = (event && event.target) || (window.event && window.event.srcElement);
			var clusterId = sender.id.substring(5);

			// TODO prompt for target 
	    	socket.emit("command", "addBinding", {
	    		type : 0x03,	// endpoint destination (not group destination)
	    		sourceAddress : this.model.get("address64"),
	    		sourceEndpoint : this.model.get("endpoint"),
	    		clusterId : clusterId,
	    		destAddress : "0013a20040770e87", // coordinator
	    		destEndpoint : 1
	    	});

		}

   	});
   
   	return AppView;
});


/*
 {"status":0,"address16":"4bbb","endpoint":1,"profileId":260,"deviceId":9,"deviceVersion":0,"deviceName":"Mains Power Outlet","inputClusters":[{"id":0,"name":"Basic"},{"id":3,"name":"Identify"},{"id":4,"name":"Groups"},{"id":5,"name":"Scenes"},{"id":6,"name":"On/Off"},{"id":21},{"id":1794,"name":"Meter"}],"outputClusters":[],"id":"4bbb01","updated":"2013-07-31T07:23:28.219Z","_id":"SAjafBXpdhFzjCUN"}
*/
