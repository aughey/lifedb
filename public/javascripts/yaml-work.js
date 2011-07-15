var yaml = null;

function updateyaml()
{
	if(yaml == null) {
		yaml = newYAML();
	}
	var data = null;
	try {
	data = JSON.stringify(yaml.eval($('#yaml').val()));
	} catch(err) {
		data = "Not valid yaml";
	}
	$('#results').html("changed to " + data);
}

$(function() {
	$('#yaml').keyup(updateyaml);
});
