var yaml = null;

function HtmlEncode(s)
{
  var el = document.createElement("div");
  el.innerText = el.textContent = s;
  s = el.innerHTML;
  delete el;
  return s;
}


function updateyaml()
{
	if(yaml == null) {
		yaml = newYAML();
	}
	var html = null;
	try {
		var data = yaml.eval($('#yaml').val());
		html = HtmlEncode(JSON.stringify(data));
/*
 * renderTemplate("pretty.underscore", data, function(html) {
			$('#pretty').html(html);
		});
		*/
		$('#pretty').html(prettyPrint(data));
	} catch(err) {
		html = "Not valid yaml " + err;
	}
	$('#results').html(html);

}

$(function() {
	$('#yaml').keyup(updateyaml);
	updateyaml();
});
