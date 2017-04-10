var express = require ('express');
var router = express.Router();
var courtModel = require('/home/guest/hoopnet/hoopnetServer/models/courtModel.js');
var fs = require('fs');

courtModel.getAllCourts();
var gotAllCourts = false;

  router.all('/', function(req, res, next) {
    console.log(req.method + " request recieved");

    res.type('text/plain');
    next();
  })

  // Middlewear for getAllCourts reqest
  router.get('/', function(req, res, next) {
    if(req.query.courtQuery === "all"){
      if(gotAllCourts){
        // get array of json court objects.
        res.send(JSON.parse(fs.readFileSync
          ("/home/guest/hoopnet/hoopnetServer/models/allCourts.json")))
      }
      // if we do not yet have courts, send error message
      else { res.send("Courts have yet to be loaded from the database") };
    } else next();
  })

  // last middlewear function
  router.all('/', function(req, res){
    res.send("catch all middlewear");
  })

// Listens for the 'gotCourts event'
//on this event, parses data and prints it to console
courtModel.eventEmitter.on('gotCourts', function(){
  gotCourts = true;
  var text = (fs.readFileSync("/home/guest/hoopnet/hoopnetServer/models/allCourts.json"));
  var json = JSON.parse(text);
  console.log('json data: ' + json[0].name);
});

module.exports = router;
