
require.config({
	"paths": {
		"jquery":              "./lib/jquery-1.9.1.min",
		"underscore":          "./lib/underscore-min",
		"backbone":            "./lib/backbone-min",
		"text":                "./lib/text",
		"bootstrap":           "./lib/bootstrap.min",
		"jade":                "./lib/jade",
		"templates":           "../templates",
		"socketio":            "../socket.io/socket.io",
	},
	"shim": {
		"underscore": {
			"exports":         "_"
		},
		"backbone": {
			"deps":            ["underscore", "jquery"],
			"exports":         "Backbone"
		},
		"socketio": {
			"exports":         "io"
		},
		"bootstrap":           ["jquery"],
	},
	"baseUrl": "javascripts"
});

require(["app"], function(App) {
	console.log("initialising app");
	App.initialize();
});
