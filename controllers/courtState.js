var express = require ('express');
var router = express.Router();

  router.get('/', function(req, res) {
    console.log("get request recieved");
    res.send("got get request");
  })

  router.put('/', function(req, res) {
    console.log("post request recieved");
    res.send("got put request");
  })

  module.exports = router;
