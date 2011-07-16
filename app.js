
/**
 * Module dependencies.
 */

var express = require('express');
var mongo = require('mongodb');

function parseID(db,id) {
	id = id.toString();
	if(id[0] == '_') {
		return "root";
	} else {
		return db.bson_serializer.ObjectID.createFromHexString(id);
// 		console.log("converted id from " + id + " to " + converted + ".");
	}
}

function getRecordCol(collection, id, callback) {
// 	console.log("getRecordCol(" + id + ")");
	var mid = parseID(collection.db,id);
// 	console.log("mid is " + mid);
	collection.findOne({_id: mid}, function(err, results) {
		// console.log("result of getRecordCol(" + id + ") is " + results);
		callback(results);
	});
}

function _getRecordPath(collection, obj, patharray, callback) {
//	console.log("_getRecordPath(" + obj + ")");
	if(patharray.length == 0) {
		callback(obj);
		return;
	}
	if(!obj) {
		callback(obj);
		return;
	}

	if(!obj.named_children) {
		callback(null);
		return;
	}

	var name = patharray.shift();

	if(!obj.named_children[name]) {
		callback(null);
	}

	getRecordCol(collection, obj.named_children[name], function(record) {
		_getRecordPath(collection,record,patharray,callback);
	});
}


function getRecordPathCol(collection, path, callback) {
	// console.log("getRecordPathCol(" + path + ")");
	var patharray = path.split('.');

	id = patharray.shift();
	getRecordCol(collection, id, function(record) {
		_getRecordPath(collection, record,patharray,callback);
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


	function getRecord(path, callback) {
		getRecordPathCol(collection, path, callback);
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
		//console.log("Executing command " + JSON.stringify(command));
		if(command.op == 'new') {
			var time = new Date;

			getRecord(command.parent_id, function(parent_record) {
				if(!parent_record) {
					returndata.push("error: no parent for " + JSON.stringify(command));
					donecallback(returndata);
					return;
				}
				var tosave = {
					data: command.data,
				created_on: time,
				parents: [ parent_record._id.toString() ]
				};
				collection.insert(tosave, function(err, docs) {
					if(err) {
						returndata.push("error");
						donecallback(returndata);
						return;
					} else {
						docs = docs[0];

						var addtoset = { children: docs._id.toString() };
						collection.update( { _id: parent_record._id }, { '$addToSet' : addtoset }, function() {
							state.lastsave = docs;
							returndata.push(docs);
							next();
						});
					}
				});
			});
		} else if(command.op == 'children') {
			getRecord(command.id,function(record) {
				if(!record) {
					returndata.push([]);
					next();
					return;
				}
				if(!record.children) {
					returndata.push([]);
					next();
					return;
				}
				var childrenids = record.children;
				if(!childrenids) {
					returndata.push([]);
					next();
				} else {
					var mids = [];
					for(var i=0;i<childrenids.length;++i) {
						var id = childrenids[i];
						mids.push(parseID(db,id));
					}

					var found = collection.find({ _id: { $in: mids} });
					if(command.sort) {
						found = found.sort(command.sort);
					}
					found.toArray(function(err, results) {
						returndata.push(results);
						next();
					});
				}
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
			getRecord(command.id, function(record) {
				if(record) {
					returndata.push(record);
					next();
				} else {
					returndata.push("error");
					donecallback(returndata);
					return;
				}
			});
		} else if(command.op == 'reparent') {
			getRecord(command.id, function(record) {
				getRecord(command.from_id, function(from) {
					getRecord(command.to_id,       function(to) {
						if(!record || !from || !to) {
							returndata.push("error, couldn't find record");
							callback();
							return;
						}

						collection.update( { _id: from._id }, { '$pull' : { children: record._id.toString() } }, function(err,foo) {
							collection.update( { _id: to._id }, { '$addToSet' : { children: record._id.toString() } }, function(err,foo) {
								returndata.push("ok");
								next();
							});
						});
					});
				});
			});
		} else {
			returndata.push("error: Unknown command " + command.op);
			donecallback(returndata);
			return;
		}
	}
	var postfunction = function(req, res) {
		var commandjs = null;
		var commandstr = req.param('commands');
		commandjs = JSON.parse(commandstr);

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
		var start = function() { startApp(db,collection); }

		getRecordCol(collection,"_", function(root) {
			if(!root) {
				console.log("root record doesn't exist.  Creating");
				collection.insert({_id: 'root'}, function(err, record) {
				});
			} else {
				start();
			}
		});
	});
});

