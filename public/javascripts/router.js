// Filename: router.js
define([
    'jquery',
    'underscore',
    'backbone',
    'models',
    'views',
  ], 
function($, _, Backbone, Models, Views) {
	
	var AppRouter = Backbone.Router.extend({
		
		/**
		 * Initializer
		 */
		initialize : function(options) {
			var self = this;
			
			options.socket.on('node', function (spec) {
				self.nodes.add(spec);
			});
			
			options.socket.on('device', function (spec) {
				self.apps.add(spec);
			});

			options.socket.on('explicit', function (packet) {
				console.log("got message: " + JSON.stringify(packet));
				// TODO route message to appropriate app
				var id = packet.remote64.hex + ".0" + packet.sourceEndpoint;
				console.log("id: " + id);
				var app = self.apps.get(id);
				if (app) {
					console.log("matched app: " + JSON.stringify(app.toJSON()));
				}
			});
			
			this.nodeListView = new Views.NodeListView({collection: this.nodes});
			this.appListView = new Views.AppListView({collection: this.apps});
		},
		
		routes: {
			""         : "showHome",
			"panel"    : "showPanel",
			"admin"    : "showAdmin",
			"nodes"    : "listNodes",
			"node/:id" : "showNode",
			"apps"     : "listApps",
			"app/:id"  : "showApp",
			'*actions' : "defaultAction"
		},

		showHome: function() {
			console.log("showing home");
			this.showPanel();
		},

		showPanel: function() {
			var el = this.panelView.render().el;
			$("#content").html(el);
		},
      
		showAdmin: function() {
			var el = this.adminView.el;
			$("#content").html(el);
		},
		
		listNodes: function() {
			var el = this.nodeListView.el;
			$("#content").html(el);
		},

		showNode: function(id) {
			//this.nodeView.model = {};
			var el = this.nodeView.render().el;
			$("#content").html(el);
		},
      
		listApps: function() {
			var el = this.appListView.el;
			$("#content").html(el);
		},
		
		showApp : function() {
			//this.appView.model = {};
			var el = this.appView.render().el;
			$("#content").html(el);
		},
        
		nodes         : new Models.NodeCollection(),
		apps          : new Models.AppCollection(),
		
		homeView      : new Views.HomeView(),
		panelView     : new Views.PanelView(),
		adminView     : new Views.AdminView(),
		nodeListView  : null,
		nodeView      : new Views.NodeView(),
		appListView   : null,
		appView       : new Views.AppView(),

    });

	/**
	 * Initialize function
	 */
    var initialize = function(socket) {
    	
      var app_router = new AppRouter({socket: socket});
      
//      app_router.on('route:showVendors', function() {
//        console.log("show vendors");
//        this.vendorListView.render();
//      });

      $( document ).ready(function() {

//		$("#locationForm").submit(function() {
//	        return false;
//		});
//		
//		$("#serviceForm").submit(function() {
//			var q = $("#serviceSearch").val();
//			console.log("searching for " + q);
//			app_router.vendorListView.loadResults(q);
//			$('#serviceSearch').blur();
//	        return false;
//		});
//		$("#serviceSearchButton").click(function() {
//			var q = $("#serviceSearch").val();
//			console.log("searching for " + q);
//			app_router.vendorListView.loadResults(q);
//		});
    	  
        console.log("routes initialised");
        Backbone.history.start();
      });
    };
    
    
    return {
      initialize: initialize
    };
});