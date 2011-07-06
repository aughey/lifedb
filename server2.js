var sys = require("sys"),  
    http = require("http"),  
    url = require("url"),  
    path = require("path"),  
    mongoose = require('mongoose'),
    fs = require("fs");  

function startHTTP(db) {
  http.createServer(function(request, response) {  
    var uri = url.parse(request.url).pathname;  
    console.log(uri);
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

var db = mongoose.connect('mongodb://localhost/lifedb');

startHTTP(db);

console.log("Server running at http://localhost:8080/");
