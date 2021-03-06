var _yaml = null;
var global_id = null;
var history = [];
var cache = { };

function clearCache() {
   cache = { };
   getID(global_id);
}

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

function clicknode(node) {
	var id = node.currentTarget.attributes['nodeid'];
   if(id) {
      id = id.value;
   } else {
  	  id = node.currentTarget.innerHTML;
   }
	getID(id);
	return false;
}

function updateRecordHTML(data)
{
		var html = prettyPrint(data);
			renderTemplate("lifedb_record.underscore", data, function(html) {
				  $('#results').html(html);
					$('#results').find('.nodeid').click(clicknode);
				});
			/*
		$('#results').prepend("<h1>" + id + "</h1> <h2>Data</h2>");
		$('#results').append(prettyPrint(data.data));
		*/
}

function getID(id) {
	if(global_id) {
  	history.push(global_id);
	}
	global_id = id;
   if(cache[id]) {
      updateRecordHTML(cache[id]);
   } else {
      executeCommand({op: 'get', id: id}, function(data) {
            // XXX DON'T CACHE cache[id] = data;
      updateRecordHTML(data);
            });
   }
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

function createnewnamedchildrecord(e)
{
	var form = $(e.currentTarget);
	var name = form.find('.name').val();
	var command = {
      op: 'new_named_child',
          name: name,
		parent_id: global_id,
			data: null
	};

	var id = global_id; // Create a context object for the callback.

	executeCommand(command, function() {
			getID(id);
			});

	return false;
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

function back()
{
	var toid = history.pop();
	if(toid) {
		global_id = null;
  	getID(toid);
	}
	return false;
}

$(function() {
	getID($('#id').attr('value'));
	$('#newchild .yaml').keyup(updateyaml);
	$('#newchild').submit(createnewchildrecord);
	$('#newnamedchild').submit(createnewnamedchildrecord);
	$('#back').click(back);
	$(window).bind('keypress',function(e) {
		if(e.keyCode == 98) {
			back();
		}
	});
});

