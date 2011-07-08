(function() {
  var templates = { }

  var jade = require("jade");

  function _renderTemplate(name,data,callback) {
    var template = templates[name];
    if(name.match(/\.mustache$/)) {
      callback(Mustache.to_html(template,{ results: data }));
    } else if(name.match(/\.jade$/)) {
      callback(jade.render(template, { locals: { data: data } }));
    } else {
      callback("unknown template");
    }
  }

  function renderTemplate(name,data,callback) {
    // Check our templates and get one if needed
    if(templates[name]) {
      _renderTemplate(name,data,callback);
    } else {
      jQuery.get(name,{}, function(template) {
        templates[name] = template;
        _renderTemplate(name,data,callback);
      });
    }
  }

  function updateDIV(id,data)
  {
    renderTemplate("results.mustache",data,function(html) {
      $(id).html(html);
    });
  }

  function update()
  {
    var divs = ['#results','#doneresults'];
    jQuery.each(divs, function(index,div) {
      $(div).html("Loading...");
      jQuery.getJSON('/search',{}, function(data) { updateDIV(div,data[0]); });
    });
  }

  function loadTemplates()
  {
    jQuery.get("/results.mustache", { }, function(data) {
      templates.results = data;
      update();
    });
  }

  $(document).ready(function() {
    //  loadTemplates();
    $('#updatebutton').click(update);
    update();
  });
})();
