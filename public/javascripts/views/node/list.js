define([ 'jquery', 
         'underscore', 
         'backbone', 
		 'jade!templates/node/list', 
		 'views/node/summary' ], 
function($, _, Backbone, NodeListTemplate, NodeView) {

	var NodeListView = Backbone.View.extend({

		initialize : function(options) {
			this.collection = options.collection;
			
			console.log("initialising Node List view");
		      
			var self = this;
			this._nodeViews = [];
			this.collection.each(function(node) {
		    	  console.log("rendering node: " + node);
		    	  self._nodeViews.push(new NodeView({
			          model : node
		    	  }));
			});
			this.collection.on("add", function(node) {
				console.log("adding node view: " + node);
				self._handleNodeAdded(node);
			});
			this.collection.on("remove", function(node) {
				console.log("removing node view: " + node);
				self._handleNodeRemoved(node);
			});
			this.collection.on("change", function(node) {
				console.log("updating node view: " + node);
				self._handleNodeChanged(node);
			});
			this.collection.on("reset", function(nodes) {
				console.log("resetting node views: " + nodes);
				self._handleNodesReset(nodes);
			});

			this.render();

		},

		model : {
			title : "Hello"
		},
		
		render: function () { 
			var compiledTemplate = NodeListTemplate(this.model);
			this.$el.html(compiledTemplate);
			
			var self = this;
			this.$el.empty();
			
			// Render each sub-view and append it to the parent view's element.
			_(this._nodeViews).each(function(nodeView) {
				$(self.el).append(nodeView.render().el);
			});

			return this;
		},
		
		_handleNodeAdded: function(node) {
			var nodeView = new NodeView({
				model : node,
				tagName : 'li'
			});
			this._nodeViews.push(nodeView);
			this.$el.append(nodeView.render().el);
		},
		
		_handleNodeRemoved: function(node) {
			// TODO find matching node view and remove
		},
		
		_handleNodeChanged: function(node) {
			// TODO find matching node view and update
			//nodeView.model = node;
			//nodeView.render();
		},

		_handleNodesReset: function(nodes) {
			var self = this;
			this._nodeViews = [];
			this.collection.each(function(node) {
		    	  console.log("rendering node: " + node);
		    	  self._nodeViews.push(new NodeView({
			          model : node,
		    	  }));
			});

			this.$el.empty();
			_(this._nodeViews).each(function(nodeView) {
				// Render each sub-view and append it to the parent view's element.
				self.$el.append(nodeView.render().el);
			});
		},
	});
	
	return NodeListView;
});