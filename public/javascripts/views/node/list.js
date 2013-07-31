define([ 'jquery', 
         'underscore', 
         'backbone', 
		 'jade!templates/node/list', 
		 'views/node/summary' ], 
function($, _, Backbone, NodeListTemplate, NodeView) {

	var NodeListView = Backbone.View.extend({

		initialize : function(options) {
			this.collection = options.collection;
			
			//console.log("initialising Node List view");
		      
			var self = this;
			this._nodeViews = [];
			this.collection.each(function(node) {
		    	self._nodeViews.push(new NodeView({ model : node }));
			});
			this.collection.on("add", function(node) {
				self._handleNodeAdded(node);
			});
			this.collection.on("remove", function(node) {
				self._handleNodeRemoved(node);
			});
			this.collection.on("change", function(node) {
				self._handleNodeChanged(node);
			});
			this.collection.on("reset", function(nodes) {
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
			this.$nodesElement = this.$el.find(".nodes");
			
			var self = this;
			this.$nodesElement.empty();
			
			// Render each sub-view and append it to the parent view's element.
			_(this._nodeViews).each(function(nodeView) {
				self.$nodesElement.append(nodeView.render().el);
			});

			return this;
		},
		
		_handleNodeAdded: function(node) {
			var nodeView = new NodeView({ model : node });
			this._nodeViews.push(nodeView);
			this.$nodesElement.append(nodeView.render().el);
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
		    	  self._nodeViews.push(new NodeView({ model : node }));
			});

			this.$nodesElement.empty();
			_(this._nodeViews).each(function(nodeView) {
				// Render each sub-view and append it to the parent view's element.
				self.$nodesElement.append(nodeView.render().el);
			});
		},
	});
	
	return NodeListView;
});