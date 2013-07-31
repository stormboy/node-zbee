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
   	});
   	
   	return AppView;
});


/*
 {"status":0,"address16":"4bbb","endpoint":1,"profileId":260,"deviceId":9,"deviceVersion":0,"deviceName":"Mains Power Outlet","inputClusters":[{"id":0,"name":"Basic"},{"id":3,"name":"Identify"},{"id":4,"name":"Groups"},{"id":5,"name":"Scenes"},{"id":6,"name":"On/Off"},{"id":21},{"id":1794,"name":"Meter"}],"outputClusters":[],"id":"4bbb01","updated":"2013-07-31T07:23:28.219Z","_id":"SAjafBXpdhFzjCUN"}
*/
