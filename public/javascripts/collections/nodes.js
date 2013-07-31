define([ '../models/node' ],
function(NodeModel) {
	
	var NodeCollection = Backbone.Collection.extend({
		
		model: NodeModel,
		
		initialize: function(models, options) {
			
		},
	});
	
	return NodeCollection;
});