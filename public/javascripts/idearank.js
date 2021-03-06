function rootpath() {
   var path = $('#rootpath').attr('value');
   if(path) {
      return path;
   } else {
      return "_.newdatabase.foo.bar.blech.";
   }
}

function humanDate(d) {
   return new Date(d)
}

function updateDIV(id,templatename,data)
{
	renderTemplate(templatename,data,function(html) {
		$(id).html(html);
	});
}

var pending_commands = 0;
function incr_pending(value) {
   pending_commands += value;
   if(pending_commands == 0) {
      $('#spinner').hide();
   } else {
      $('#spinner').show();
   }
}

function executeCommand(command, callback) {
   incr_pending(1);
	jQuery.post("/execute",{ commands: JSON.stringify([command]) },function(data) {
		data = jQuery.parseJSON(data);
      incr_pending(-1);
		if(callback) {
			callback(data[0]);
		}
	});
}

function executeCommands(commands, callback) {
   incr_pending(1);
	jQuery.post("/execute",{ commands: JSON.stringify(commands) },function(data) {
		data = jQuery.parseJSON(data);
      incr_pending(-1);
		if(callback) {
			callback(data);
		}
	});
}

function disableall()
{
  $('input').attr("disabled",true);
}

function enableall()
{
  $('input').removeAttr("disabled");
}

function update()
{

	var divs = ['#pending' ,'#done'];
	var commands = [];
	jQuery.each(divs, function(index,div) {
		var templatename = div.substr(1) + ".underscore"
		getTemplate(templatename);
	  //$(div).html("Loading...");
	var command = {
		op: 'children',
		id: rootpath() + div.substr(1),
		sort: { created_on: -1 }
	//q: { '$query': null }
	// q: { }
	//q: { '$orderby': 'idea'}
	};
	commands.push(command);
	});

	executeCommands(commands, function(data) {
		jQuery.each(divs, function(index,div) {
			var templatename = div.substr(1) + ".underscore"
			updateDIV(div,templatename,data[index]);
		});
	});
        enableall();
}

/*
$(document).ready(function() {
	$('#updatebutton').click(update);
	update();
	//executeCommand({ op: 'get', rawid: 'lifedb'}, update);
});
*/

function newidea(idea) {
  disableall();
	var command = {
		op: 'new',
		data: { idea: idea.attr('value') },
		parent_id: rootpath() + 'pending',
      options: { create_parents: true }
	};
	executeCommand(command, update);
}

var incr = 0;
function completeidea(id,from,to) {
   incr = incr + 1;
  disableall();
	executeCommands([{
		op: 'reparent',
		id: id,
		from_id: rootpath() + from,
		to_id: rootpath() + to,
      options: { create_parents: true }
	},
   {
     op: 'add_to_set',
     id: id,
     field: 'test',
     value: incr
   }], update);
}
//})();
