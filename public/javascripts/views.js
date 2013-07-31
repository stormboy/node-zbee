define([
	'views/home',
	'views/panel',
	'views/admin',
	'views/node/list',
	'views/node/show',
	'views/app/list',
	'views/app/show',
],
function(HomeView, PanelView, AdminView, NodeListView, NodeView, AppListView, AppView) {
	return {
		HomeView: HomeView,
		PanelView: PanelView, 
		AdminView: AdminView, 
		NodeListView: NodeListView, 
		NodeView: NodeView, 
		AppListView: AppListView, 
		AppView: AppView
	}
});
