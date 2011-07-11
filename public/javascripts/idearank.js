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

function updateDIV(id,templatename,data)
{
	renderTemplate(templatename,data,function(html) {
		$(id).html(html);
	});
}

function executeCommand(command, callback) {
	jQuery.post("/execute",{ commands: JSON.stringify([command]) },function(data) {
		data = jQuery.parseJSON(data);
		if(callback) {
			callback(data[0]);
		}
	});
}

function executeCommands(commands, callback) {
	jQuery.post("/execute",{ commands: JSON.stringify(commands) },function(data) {
		data = jQuery.parseJSON(data);
		if(callback) {
			callback(data[0]);
		}
	});
}


function update()
{
	var divs = ['#pending' ,'#done'];
	jQuery.each(divs, function(index,div) {
		var templatename = div.substr(1) + ".underscore"
		getTemplate(templatename);
	//$(div).html("Loading...");
	var command = {
		op: 'children',
		id: '_lifedb.' + div.substr(1),
		sort: { created_on: -1 }
	//q: { '$query': null }
	// q: { }
	//q: { '$orderby': 'idea'}
	};
	executeCommand(command, function(data) {
		updateDIV(div,templatename,data);
	});
	});
}

$(document).ready(function() {
	$('#updatebutton').click(update);
	update();
	//executeCommand({ op: 'get', rawid: 'lifedb'}, update);
});

function newidea(idea) {
	var command = {
		op: 'new',
		data: { idea: idea.attr('value') },
		parent_id: '_lifedb.pending',
	};
	executeCommand(command, update);
}

function completeidea(id,from,to) {
	executeCommand({
		op: 'reparent',
		id: id,
		from_id: '_lifedb.' + from,
		to_id: '_lifedb.' + to,
	}, update);
}
//})();
