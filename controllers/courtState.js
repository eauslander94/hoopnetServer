var express = require ('express');
var router = express.Router();
var courtQueries = require('/home/guest/hoopnet/hoopnetServer/models/courtModel.js');


  router.all('/', function(req, res, next) {
    console.log(req.method + " request recieved");
    res.type('text/plain');
    next();
  })

  // Middlewear for getAllCourts reqest
  router.get('/', function(req, res, next) {
    if(req.query.courtQuery === "all"){
      console.log(courtQueries.getAllCourts());
      res.send(courtQueries.getAllCourts());
    }
    else next();
  })

  // last middlewear function
  router.all('/', function(req, res){
    res.send("catch all middlewear");
  })

  module.exports = router;
