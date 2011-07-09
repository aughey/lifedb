//(function() {
  var templates = { }

  var jade = require("jade");

  function _renderTemplate(name,data,callback) {
    var template = _.template(templates[name]);
    if(name.match(/\.underscore$/)) {

      //callback(Mustache.to_html(template,{ results: data }));
			var html = template({ results: data });
      callback(html);
    } else if(name.match(/\.jade$/)) {
      callback(jade.render(template, { locals: { data: data } }));
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
      // render any registered template funcitons
      var regcb = templates[name];
      templates[name] = template;
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
    jQuery.post("/execute",{ command: JSON.stringify(command) },function(data) {
      data = jQuery.parseJSON(data);
			if(callback) {
				callback(data);
			}
    });
  }

  function update()
  {
    var divs = ['#pending','#done'];
    var templatename = "results.underscore";
    jQuery.each(divs, function(index,div) {
      getTemplate(templatename);
      $(div).html("Loading...");
      var command = {
        op: 'children',
			  rawid: 'lifedb',
			  bucket: div.substr(1)
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
    executeCommand({ op: 'get', rawid: 'lifedb'}, update);
  });

  function sendidea(idea) {
    var command = {
      op: 'new',
      data: { idea: idea.attr('value') },
      parent_rawid: 'lifedb',
			bucket: 'pending'
    };
    executeCommand(command, update);
  }

  function completeidea(id) {
		alert(id);
	}
//})();
