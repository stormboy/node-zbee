define([
	'jquery',
	'backbone',
	'socketio',
], 
function($, Backbone, io) {

	var NodeModel = Backbone.Model.extend({

		// TODO for nested model
//	    model: {
//	        layout: layoutModel,
//	    },
	    
	    idAttribute: "address64",

//	    parse: function(response){
//	        for(var key in this.model)
//	        {
//	            var embeddedClass = this.model[key];
//	            var embeddedData = response[key];
//	            response[key] = new embeddedClass(embeddedData, {parse:true});
//	        }
//	        return response;
//	    }
	});
	
	return NodeModel;
});