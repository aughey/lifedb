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
	executeCommand({op: 'get', id: id}, function(data) {
		$('#results').html(prettyPrint(data));
		$('#results').prepend("<h1>" + id + "</h1>");
		$('#yaml').val(data);
	});
}

$(function() {
	getID($('#id').attr('value'));
});

