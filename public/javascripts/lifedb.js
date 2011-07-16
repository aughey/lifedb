var _yaml = null;
var global_id = null;

function yaml() {
	if(_yaml == null) {
		_yaml = newYAML();
	}
	return _yaml;
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
			callback(data);
		}
	});
}

function getID(id) {
	global_id = id;
	executeCommand({op: 'get', id: id}, function(data) {
			renderTemplate("lifedb_record.underscore", data, function(html) {
				  $('#results').html(html);
				});
			/*
		$('#results').prepend("<h1>" + id + "</h1> <h2>Data</h2>");
		$('#results').append(prettyPrint(data.data));
		*/
	});
}

function updateyaml(obj)
{
	obj = $(obj.currentTarget);
	var yamlresults = obj.siblings('.yamlresults');
	try {
		var data = yaml().eval(obj.val());
	} catch(err) {
		yamlresults.html("Invalid YAML");
		return;
	}
	var html = JSON.stringify(data);
	yamlresults.html(html);
}

function createnewchildrecord(e)
{
	var form = $(e.currentTarget);
	var data = yaml().eval(form.find('.yaml').val());
	var command = {
op: 'new',
		parent_id: global_id,
			data: data
	};

	var id = global_id; // Create a context object for the callback.
	executeCommand(command, function() {
			getID(id);
			});

	return false;
}

$(function() {
	getID($('#id').attr('value'));
	$('#newchild .yaml').keyup(updateyaml);
	$('#newchild').submit(createnewchildrecord);
});

