var sys = require("sys"),  
    http = require("http"),  
    url = require("url"),  
    path = require("path"),  
    mongo = require('mongodb'),
    fs = require("fs");  

function startHTTP(db) {
  console.log(db)
    http.createServer(function(request, response) {  
      var uri = url.parse(request.url).pathname;  
      var filename = path.join(process.cwd(), uri);  
      path.exists(filename, function(exists) {  
        if(!exists) {  
          response.writeHead(404, {"Content-Type": "text/plain"});  
          response.end("404 Not Found\n");  
          return;  
        }  

        fs.readFile(filename, "binary", function(err, file) {  
          if(err) {  
            response.writeHead(500, {"Content-Type": "text/plain"});  
            response.end(err + "\n");  
            return;  
          }  

          response.writeHead(200);  
          response.end(file, "binary");  
        });  
      });  
    }).listen(8080);  
}

var db = new mongo.Db('lifedb', new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT, {}), {});

db.open(function() { startHTTP(db); });

console.log("Server running at http://localhost:8080/");
