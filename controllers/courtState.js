var express = require ('express');
var router = express.Router();
var courtModel = require('/home/guest/hoopnet/hoopnetServer/models/courtModel.js');
var fs = require('fs');
router.use(require('body-parser')());


// get all courts upon firing up the server
//courtModel.getAllCourts();
//var gotAllCourts = false; // changes to true when courts come in

  router.all('/', function(req, res, next) {
    console.log(req.method + " request recieved");

    res.type('text/plain');
    next();
  })

  // Middlewear for getAllCourts reqest
  router.get('/getAllCourts', function(req, res, next) {

      courtModel.getAllCourts();
      courtModel.eventEmitter.once("gotAllCourts", function(courts){
        // send an array of JSON objects containing all courts
        res.send(courts);
      })
  })

  // middlewear for refresh request
  // query params: name, lat and long of the court to be refreshed
  // post: response is sent with the latest version of the given court
  router.get('/refresh', function(req, res, next) {
    console.log("got refresh request");
    courtModel.refresh(req.query.courtName, req.query.lat, req.query.long);

      courtModel.eventEmitter.once('gotOneCourt', function(court){
        console.log("got courtname from event listner " + court.name);
        res.send(court);
      })
  })


  // handling putOneGame requests
  // post: givern game corresponding to given basket on given court
  //       is put into the db and replaces current game.
  router.put('/putOneGame', function(req, res, next) {

      console.log("putOneGame request recieved");
      courtModel.putOneGame(req.body.court, req.body.basketNo, req.body.game);
      res.end();
  })

  // last middlewear function
  router.all('/', function(req, res){
    res.send("catch all middlewear");
  })


// Listens for the 'gotCourts event'
//on this event, parses data and prints it to console
courtModel.eventEmitter.on('gotCourts', function(){
  gotAllCourts = true;
  var text = (fs.readFileSync("/home/guest/hoopnet/hoopnetServer/models/allCourts.json"));
  var json = JSON.parse(text);
  console.log('json data: ' + json[0].name);
});

module.exports = router;
