var express = require ('express');
var router = express.Router();


  router.all('/', function(req, res) {
    console.log(req.method + " request recieved");
    res.type('text/plain');
    res.send("got get request");
  })





  module.exports = router;
