define([ 'jquery', 
         'underscore', 
         'backbone', 
		'jade!templates/app/list',
		'views/app/summary' ], 
function($, _, Backbone, AppListTemplate, AppView) {
	
	var AppListView = Backbone.View.extend({
		//el : $("#content"),

		initialize : function() {
		      //console.log("initialising App List view");
		      var self = this;
		      this._appViews = [];
		      this.collection.each(function(node) {
			    	  self._appViews.push(new AppView({ model : node }));
				});
		      this.collection.on("add", function(app) {
					self._handleAppAdded(app);
				});
		      this.collection.on("remove", function(app) {
					self._handleAppRemoved(app);
				});
		      this.collection.on("change", function(app) {
					self._handleAppChanged(app);
				});
		      this.collection.on("reset", function(apps) {
					self._handleAppsReset(app);
				});

		      this.render();
		},
		
		model : {
			title : "Hello"
		},
		
		render: function () { 
			var compiledTemplate = AppListTemplate(this.model);
			this.$el.html(compiledTemplate);
			this.$appsElement = this.$el.find(".apps");

			var self = this;
			self.$appsElement.empty();
			
			// Render each sub-view and append it to the parent view's element.
			_(this._appViews).each(function(appView) {
				self.$appsElement.append(appView.render().el);
			});
			
			return this;
		},
		
		_handleAppAdded: function(app) {
			var appView = new AppView({ model : app });
			this._appViews.push(appView);
			this.$appsElement.append(appView.render().el);
		},
		
		_handleAppRemoved: function(app) {
			// TODO find matching node view and remove
		},
		
		_handleAppChanged: function(app) {
			// TODO find matching node view and update
			//nodeView.model = node;
			//nodeView.render();
		},

		_handleAppsReset: function(apps) {
			var self = this;
			this._appViews = [];
			this.collection.each(function(app) {
		    	  self._appViews.push(new AppView({ model : node }));
			});

			this.$el.empty();
			_(this._appViews).each(function(appView) {
				// Render each sub-view and append it to the parent view's element.
				self.$appsElement.append(appView.render().el);
			});
		},
	});
	
	return AppListView;
});
