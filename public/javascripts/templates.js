//(function() {
var templates = { }

//  var jade = require("jade");

function _renderTemplate(name,data,callback) {
	var template = templates[name];
	if(name.match(/\.underscore$/)) {

		//callback(Mustache.to_html(template,{ results: data }));
		var html = template({ results: data });
		callback(html);
	} else {
		callback("unknown template");
	}
}

function getTemplate(name, callback) {
	if(templates[name]) {
		return;
	}
	templates[name] = [];
	jQuery.get(name,{}, function(template) {
		// Compile the template
		if(name.match(/\.underscore$/)) {
			template = _.template(template);
		} else {
			alert("unknown template type " + name);
		}

		var regcb = templates[name];
		templates[name] = template;
		// render any registered template funcitons
		jQuery.each(regcb, function(index, cb) {
			cb(template);
		});
		if(callback) {
			callback(template);
		}
	});
}

function renderTemplate(name,data,callback) {
	// Check our templates and get one if needed
	if(templates[name]) {
		if(templates[name] instanceof Array) {
			templates[name].push(function() {
				_renderTemplate(name,data,callback);
			});
		} else {
			_renderTemplate(name,data,callback);
		}
	} else {
		getTemplate(name,function() {
			_renderTemplate(name,data,callback);
		});
	}
}

