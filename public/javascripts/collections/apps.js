define([ '../models/app' ],
function(AppModel) {
	
	var AppCollection = Backbone.Collection.extend({
		
		model: AppModel,
		
		initialize: function(models, options) {
			
		},
	});
	
	return AppCollection;
});