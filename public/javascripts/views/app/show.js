define(['jquery', 
        'underscore', 
        'backbone', 
   		'jade!templates/app/show' ], 
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
   			var compiledTemplate = AppTemplate(this.model);
   			this.$el.html(compiledTemplate);
   			return this;
   		},
   	});
   	
   	return AppView;
});
