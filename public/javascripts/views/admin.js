define([ 'jquery', 
         'underscore', 
         'backbone', 
		'jade!templates/admin' ], 
function($, _, Backbone, AdminTemplate) {
	
	var AdminView = Backbone.View.extend({
		//el : $("#content"),

		initialize : function() {
			//console.log("initialising Admin view");
			this.render();
		},
		
		model : {
			title : "Hello"
		},
		
		render: function () { 
			var compiledTemplate = AdminTemplate(this.model);
			this.$el.html(compiledTemplate);
			return this;
		},
		
		events: { 
			"click #configure"      : "doConfigure",
			"click #save"           : "doSave",
			"click #reset"          : "doReset",
			"click #join"           : "doJoin",
			"click #discover"       : "doDiscover",
			"click #queryAddresses" : "doQueryAddresses",
			"click #association"    : "doCheckAssociation",
			"click #addBinding"     : "doAddBinding",
			"click #configReporting": "doConfigReporting",
			"click #discoverAttributes": "doDiscoverAttributes",
			"click #idSubmit"       : "doIdSubmit",
			"change #at"            : "doAtCommand",
			"click #test"           : "doTest",
		},
		
		doQueryAddresses: function( event ) {
			socket.emit("command", "queryAddresses");
		},
		
	    doConfigure: function( event )  {
	    	socket.emit("command", "configure");
	    },
	    
	    dosave: function( event ) {
	    	socket.emit("command", "save");
	    },
	    
	    doReset: function( event ) {
	    	socket.emit("command", "reset");
	    },
	    
	    doJoin: function( event ) {
	    	socket.emit("command", "join");
	    },
	    
	    doDiscover: function( event ) {
	    	socket.emit("command", "discover", {command: "discover", "params": []});
	    },
	    
	    // check ZB node association
	    doCheckAssociation: function( event ) {
	    	socket.emit("command", "association");
	    },
	    
	    doAddBinding: function(event) {
	    	socket.emit("command", "addBinding", {
	    		type : 0x03,	// endpoint destination (not group destination)
//	    		sourceAddress : {"dec":[0x00, 0x13, 0x7a, 0x00, 0x00, 0x00, 0xb6, 0xcc],"hex":"00137a000000b6cc"},
	    		sourceAddress : {"dec":[0x00, 0x13, 0x7a, 0x00, 0x00, 0x00, 0xb6, 0xcf],"hex":"00137a000000b6cf"},
	    		sourceEndpoint : 1,
	    		clusterId : 6,
	    		destAddress : {"dec":[0, 19, 162, 0, 64, 119, 14, 135],"hex":"0013a20040770e87"}, // coordinator
	    		//destAddress : {"dec":[0, 0, 0, 0, 0, 0, 0, 0], "hex":"0000000000000000"},	// coordinator
	    		destEndpoint : 1
	    	});
	    	
//	    	socket.emit("command", "addBinding", {
//	    		type : 0x03,	// endpoint destination (not group destination)
//	    		sourceAddress : {"dec":[0,19,122,0,0,0,152,207],"hex":"00137a00000098cf"},
//	    		// {"dec":[0,19,122,0,0,0,139,67], "hex":"00137a0000008b43"},
//	    		sourceEndpoint : 2,
//	    		clusterId : 6,
////	    		destAddress : {"dec":[0,19,122,0,0,0,182,207],"hex":"00137a000000b6cf"},
////	    		destEndpoint : 1
	    	
////	    		destAddress : {"dec":[0, 19, 162, 0, 64, 119, 14, 135],"hex":"0013a20040770e87"},
//	    		destAddress : {"dec":[0, 0, 0, 0, 0, 0, 0, 0],"hex":"0000000000000000"},
//	    		destEndpoint : 1
//	    	});
	    },
	    
	    doConfigReporting: function(event) {
	    	/* {
	   		  	 direction: 0x01,
	   		    id: 0x0001,
	   		    type: 0x01,                         // if direction == 0
	   		    minInterval: 0x0001,                // if direction == 0
	   		    maxInterval: 0x0001,                // if direction == 0. if 0xFFFF, then cancel/no report
	   		    change: [0x00, 0x00, 0x00, 0x00 ],  // if direction == 0
	   		    timeout: 0x0000                     // if direction == 1
	   		  }
	   		 */
	    	socket.emit("command", "configReporting", {
	    		address64 : "00137a000000b6cf",
	    		endpoint : 1,
	    		clusterId : 6,
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
	    
	    doDiscoverAttributes: function(event) {
	    	socket.emit("command", "discoverAttributes", {
	    		address64 : "00137a000000b6cf",
	    		endpoint : 1,
	    		clusterId : 6,
	    		start: 0,
	    		max: 10
	    	})
	    },

	    doTest: function( event ) {
	    	socket.emit("command", "test");
	    },

		// submit ID    
	    doIdSubmit: function( event ) {
	    	socket.emit("command", "id", $(event.target).val());
	    },

	    // send AT command
	    doAtCommand: function(event) {
	    	console.log("event: " + event.target);
	    	socket.emit("at", $(event.target).val());
	    },
	});
	
	return AdminView;
});
