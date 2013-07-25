$( document ).ready(function() {
	var socket = io.connect('http://localhost');
	
	socket.on('node', function (data) {
		console.log("got node: " + JSON.stringify(data));
	    $("#log").append("<div style='margin-top: 10px'>" + JSON.stringify(data) + "</div>");

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
    
    // check ZB node association
    $( "#association" ).click(function( event ) {
    	socket.emit("command", "association");
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