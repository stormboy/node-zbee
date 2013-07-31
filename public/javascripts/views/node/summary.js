define([ 'jquery', 
         'underscore', 
         'backbone', 
		'jade!templates/node/summary' ], 
function($, _, Backbone, NodeTemplate) {
	
	var NodeView = Backbone.View.extend({
		//el : $("#content"),

		initialize : function(options) {
			//console.log("initialising Node view. model: " + JSON.stringify(this.model));
		},
		
		model : {
			title : "Hello"
		},
		
		render: function () { 
			//console.log("rendering Node view. model: " + JSON.stringify(this.model));
			var compiledTemplate = NodeTemplate(this.model.toJSON());
			this.$el.html(compiledTemplate);
			return this;
		},
	});
	
	return NodeView;
});
