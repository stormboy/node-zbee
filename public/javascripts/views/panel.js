define([ 'jquery', 
         'underscore', 
         'backbone', 
		'jade!templates/panel' ], 
function($, _, Backbone, PanelTemplate) {
	
	var PanelView = Backbone.View.extend({
		//el : $("#content"),

		initialize : function() {
		      console.log("initialising Panel view");
		},
		
		model : {
			title : "Hello"
		},
		
		render: function () { 
			var compiledTemplate = PanelTemplate(this.model);
			this.$el.html(compiledTemplate);
			return this;
		},
	});
	
	return PanelView;
});