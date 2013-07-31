define([
	'collections/nodes',
	'models/node',
	'collections/apps',
	'models/app',
],
function(NodeCollection, NodeModel, AppCollection, AppModel) {
	return {
		NodeCollection : NodeCollection,
		NodeModel      : NodeModel, 
		AppCollection : AppCollection,
		AppModel      : AppModel, 
	}
});