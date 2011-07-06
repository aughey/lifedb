
/**
 * Module dependencies.
 */

var express = require('express');
var mongo = require('mongodb');

function sendID(collection,mid,res)
{
    collection.findOne({_id: mid}, function(err, results) {
      if(results) {
        res.send(JSON.stringify(results));
      } else {
        res.send(JSON.stringify(null));
      }
    });
}

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
    res.render('index', {
      title: 'Express 2'
    });
  });
  app.post("/save", function(req, res) {
    var data = req.param('data');
    var datajs = JSON.parse(data);
    var tosave = {
      data: datajs
    };
    collection.insert(tosave, function(err, docs) {
      if(err) {
        res.send(err);
      } else {
        res.send(JSON.stringify(docs));
      }
    });
  });
  app.get('/get', function(req, res) {
    var id = req.param('id');
    var mid = db.bson_serializer.ObjectID.createFromHexString(id);
    sendID(collection,mid,res);
  });
  app.get('/search', function(req, res)  {
    var querystr = req.param('q');
    var query = {};
    if(querystr) {
      query = JSON.parse(querystr);
    }
    collection.find(query).toArray(function(err, results) {
      res.send(JSON.stringify(results));
    });
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

