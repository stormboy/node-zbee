define([ 'jquery', 
         'underscore', 
         'backbone', 
		'jade!templates/home' ], 
function($, _, Backbone, HomeTemplate) {
	
	var HomeView = Backbone.View.extend({
		//el : $("#content"),

		initialize : function() {
		      console.log("initialising home view");
		},
		
		model : {
			title : "Hello"
		},
		
		render: function () { 
			var compiledTemplate = HomeTemplate(this.model);
			this.$el.html(compiledTemplate);
			return this;
		},
	});
	
	return HomeView;
});
