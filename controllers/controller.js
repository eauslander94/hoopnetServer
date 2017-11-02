var express = require ('express');
var router = express.Router();
var courtModel = require('../models/courtModel.js');
var userModel = require ('../models/userModel.js');
var fs = require('fs');



  router.all('/', function(req, res, next) {
    console.log(req.method + " request recieved");

    res.type('text/plain');
    next();
  })



  // Sends back an array of all courts in our db
  router.get('/getAllCourts', (req, res, next) => {

    courtModel.getAllCourts().then((courts) => {
      res.send(courts);
    }).catch((err) => {  next(err)  });
  })


  // Sends back an array of users
  // Param:  [String] - array of user ids of users to be fetched
  router.get('/getUsers', function(req, res, next) {
    // Resolve the promise returned by the model
    userModel.getUsers(JSON.parse(req.query.user_ids)).then((userArrays) => {
      // massage data into array of users, send it back
      let users = [];
      for(let user of userArrays)
        users.push(user[0]);
      res.send(users);
    }).catch((err) => {  next(err)  });
  })


  // Sends back an array of users that match the searchterm
  router.get('/getUsersByName', function(req, res, next) {
    userModel.getUsersByName(req.query.searchterm).then((userArrays) => {
      // massage data into array of users, send it back
      let users = [];
      for(let user of userArrays)
        users.push(user[0]);
      res.send(users);
    }).catch((err) => {  next(err)  });
  });


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


  // Post: provided windowData replaces corresponding windowData in db
  // Post in the future - socket sends out blast that this window has been updated
  router.put('/putWindowData', function(req, res, next) {

    courtModel.putWindowData(req.body.windowData).then((court) => {
      // Here we will use a socket to tell all clients that our window has been updated
      res.send(court);
    }).catch((err) => {  next(err)  });
  })


  // Post: User in db is replaced with given user, updated user sent back in res objct
  router.put('/putUser', (req, res, next) => {
    userModel.putUser(req.body.user).then((user) => {
      res.send(user);
    }).catch((err) => {  console.log(err);  next(err)  });
  })


  // Post: Sends back array of updated users, starting withuser 1
  router.put('/addFriend', (req, res, next) => {
    userModel.addFriend(req.body.user1, req.body.user2).then((users, err) => {
      if (err) throw err;
      res.send([users[2], users[3]]);
    }).catch((err) => { console.log(err);  next(err)  });
  })


  // RequestedUser added to currentUser's friend requests
  router.put('/requestFriend', (req, res, next) => {
    userModel.requestFriend(req.body.requestedUser, req.body.currentUser)
     .then(() => { res.send({}) })
    .catch((err) => { console.log(err);  next(err)  });
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



module.exports = router;
