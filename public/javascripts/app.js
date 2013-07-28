$( document ).ready(function() {
	var socket = io.connect('http://localhost');

	// map of address64 to endpoint
	var nodes = {};
	
	// map of _id to endpoint
	var endpoints = {};
	
	socket.on('node', function (spec) {
		console.log("got node: " + JSON.stringify(spec));
		//data.address64
		
		var existing = nodes[spec.remote64.hex];
		if (!existing) {
			nodes[spec.remote64.hex] = spec;
			$("#nodes").append("<div id='" + spec.remote64.hex + "' style='margin-top: 10px'>" + JSON.stringify(spec) + "</div>");
		}
	});

	socket.on('application', function (spec) {
		console.log("got application: " + JSON.stringify(spec));
		var existing = endpoints[spec.id];
		if (!existing) {
			endpoints[spec.id] = spec;
			$("#applications").append("<div id='" + spec.id + "' style='margin-top: 10px'>" + JSON.stringify(spec) + "</div>");
		}
	});
	
    $( "#configure" ).click(function( event ) {
    	socket.emit("command", "configure");
    });
    $( "#save" ).click(function( event ) {
    	socket.emit("command", "save");
    });
    $( "#reset" ).click(function( event ) {
    	socket.emit("command", "reset");
    });
    
    $( "#join" ).click(function( event ) {
    	socket.emit("command", "join");
    });
    
    $( "#discover" ).click(function( event ) {
    	socket.emit("command", "discover", {command: "discover", "params": []});
    });
    $( "#queryAddresses" ).click(function( event ) {
    	socket.emit("command", "queryAddresses");
    });
    
    // check ZB node association
    $( "#association" ).click(function( event ) {
    	socket.emit("command", "association");
    });
    $( "#addBinding" ).click(function(event) {
    	socket.emit("command", "addBinding", {
    		type : 0x03,	// endpoint destination (not group destination)
    		sourceAddress : {"dec":[0,19,122,0,0,0,152,207],"hex":"00137a00000098cf"},
    		// {"dec":[0,19,122,0,0,0,139,67], "hex":"00137a0000008b43"},
    		sourceEndpoint : 2,
    		clusterId : 6,
    		destAddress : {"dec":[0,19,122,0,0,0,182,207],"hex":"00137a000000b6cf"},
    		destEndpoint : 1
    	});
    });

    $( "#test" ).click(function( event ) {
    	socket.emit("command", "test");
    });

	// submit ID    
    $( "#idSubmit" ).click(function( event ) {
    	socket.emit("command", "id", $("#id").val());
    });
    
    // send AT command
    $( "#at" ).change(function(event) {
    	socket.emit("at", $(this).val());
    });
    
});