
/**
 * Module dependencies.
 */

var express = require('express');
var mongo = require('mongodb');

function startApp(db,collection) {
  var app = module.exports = express.createServer();

  // Configuration

  app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.compiler({ src: __dirname + '/public', enable: ['sass'] }));
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
  });

  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  });

  app.configure('production', function(){
    app.use(express.errorHandler()); 
  });

  // Routes

  app.get('/', function(req, res){
    res.redirect("/idearank.html");
    /*
    res.render('index', {
      title: 'Express 2'
    });
    */
  });

  function executeSingleCommand(command, res) {
    executeCommand([command],0,{}, [], function(ret) {
      if(ret.length != 1) {
        console.log("Really bad, the return value length of executeCommand through ExecuteSingleCommand was not 1");
      } else {
        ret = ret[0];
      }
      res.send(JSON.stringify(ret));
    });
  }

  function getRecordFromCommand(prefix, command, callback) {
    var mid;
    if(command[prefix + "rawid"]) {
      mid = command[prefix + 'rawid']
    } else if(command[prefix + "id"]) {
      mid = db.bson_serializer.ObjectID.createFromHexString(command[prefix + 'id']);
    } else {
      callback(null);
      return;
    }
    collection.findOne({_id: mid}, function(err, results) {
      callback(results);
    });
  }

  function executeCommand(commands, index, state, returndata, donecallback) {
    if(index >= commands.length) {
      donecallback(returndata);
      return;
    }
    var command = commands[index];
    var next = function() {
      executeCommand(commands,index+1,state,returndata,donecallback);
    }
    if(command.op == 'new') {
      var time = new Date;

      getRecordFromCommand("parent_",command, function(parent_record) {
        if(!parent_record) {
          returndata.push("error: no parent for " + JSON.stringify(command));
          donecallback(returndata);
          return;
        }
        var tosave = {
          data: command.data,
          created_on: time,
          parents: [ parent_record._id ]
        };
        collection.insert(tosave, function(err, docs) {
          if(err) {
            returndata.push("error");
            donecallback(returndata);
            return;
          } else {
            state.lastsave = docs;
            returndata.push(docs);
            next();
          }
        });
      });
    } else if(command.op == 'search') {
      var q = command.q;
      if(!q) {
        q = { }
      }
      collection.find(q).toArray(function(err, results) {
        returndata.push(results);
        next();
      });
    } else if(command.op == 'get') {
      getRecordFromCommand("",command, function(record) {
        if(record) {
          returndata.push(record);
          next();
        } else {
          returndata.push("error");
          donecallback(returndata);
          return;
        }
      });
    } else if(command.op == 'add_child') {
    } else {
      returndata.push("error: Unknown command " + command.op);
      donecallback(returndata);
      return;
    }
  }
  var postfunction = function(req, res) {
    var commandjs = null;
    if(req.param('command')) {
      var commandstr = req.param('command');
      commandjs = [JSON.parse(commandstr)];
    } else if(req.param('commands')) {
      var commandstr = req.param('commands');
      commandjs = JSON.parse(commandstr);
    }

    var returndata = [ ];
    var state = { };
    executeCommand(commandjs,0,state,returndata,function() {
      res.send(JSON.stringify(returndata));
    });
  }
  app.post("/execute", postfunction);
  app.get("/execute", postfunction);

  app.get('/get', function(req, res) {
    executeSingleCommand( { op: 'get', id: req.param('id') }, res);
  });
  app.get('/search', function(req, res)  {
    var q = req.param('q');
    executeSingleCommand( { op: 'search', q: q }, res);
  });
  app.post('/update', function(req, res)  {
    var id = req.param('id');
    var mid = db.bson_serializer.ObjectID.createFromHexString(id);
    var datajs = JSON.parse(req.param('data'));
    collection.update({_id: mid},{ $set: { data: datajs }},function(err, results) {
      sendID(collection,mid,res);
    });
  });


  app.listen(3000);

  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}

var db = new mongo.Db('lifedb', new mongo.Server('localhost', 27017, {}), {});
db.open(function(err, db) {
  db.collection('lifedb', function(err, collection) {
    if(err) {
      console.log("Error getting collection");
    } else {
      console.log('Connectecd to mongodb lifedb');
      startApp(db,collection);
    }
  });
});

