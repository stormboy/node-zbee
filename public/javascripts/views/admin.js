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
	    		sourceAddress : {"dec":[0,19,122,0,0,0,152,207],"hex":"00137a00000098cf"},
	    		// {"dec":[0,19,122,0,0,0,139,67], "hex":"00137a0000008b43"},
	    		sourceEndpoint : 2,
	    		clusterId : 6,
	    		destAddress : {"dec":[0,19,122,0,0,0,182,207],"hex":"00137a000000b6cf"},
	    		destEndpoint : 1
	    	});
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
