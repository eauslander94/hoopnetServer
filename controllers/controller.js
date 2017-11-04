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


  // Sends back an observable emitting an array of fetched courts
  // Query param - Array of string _ids of courts to be fetched
  router.get('/getCourtsById', (req, res, next) => {
    courtModel.getCourtsById(JSON.parse(req.query.court_ids))
    .then((courts) => {
        let responseCourts = []
        for(let court of courts)
          responseCourts.push(court[0]);
        res.send(responseCourts);
      })
      .catch((err) => {
        console.log('Error fetching courts: Controller.js /getCourtsById' + err);
        next(err);
      });
  })


  // Sends onject with response code and an array of courts. Codes are below
    // 1 - Found only one court within courtside distance - sends it back
    // 2 - Found more than one court within courtside distance - sends them back
    // 3 - Found no courts w/in courtside distance, sending back courts w/in 10 miles
    // 4 - No courts w/in 10 miles.  sends back only response code

  router.get('/courtside', (req, res, next) => {
    courtModel.courtsByLocation(JSON.parse(req.query.location), 100)
    .then((courts) => {
      switch(courts.length){
        case 1:
          res.send({responseCode: 1, courts: courts});
          break;
        case 0:
        // get courts within 10 miles of location
          courtModel.courtsByLocation(JSON.parse(req.query.location), 16000)
          .then((courts) => {
            if(courts.length > 0)
              res.send({responseCode: 3, courts: courts})
            else res.send({responseCode: 4});
          }).catch((err) => { console.log('error /courtside controller.js\n' + err) })
          break;
        default:
          res.send({responseCode: 2, courts: courts});
          break;
      }
    }).catch((err) => { console.log('error /courtside controller.js\n' + err) });
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


  // Sends back an array of the updated users, ser1 in position 0;
  router.put('/removeFriend', (req, res, next) => {
    userModel.removeFriend(req.body.user1, req.body.user2).then((users) =>{
      console.log(users[0]);
      res.send([users[0], users[1]])
    }).catch((err) => {
      console.log('error in controller.js /removeFriend ' + err);
      next(err);
    })
  })


  // Post:  User added to court's pNow, court added to user's courtside
  // Body params: ids of respective user and court
  // Sends: updated court and updated user
  router.put('/courtsidePut', (req, res, next) => {
    console.log('got put request');
    let promises = [];
    promises.push(courtModel.courtsidePut(req.body.court_id, req.body.user_id));
    promises.push(userModel.courtsidePut(req.body.court_id, req.body.user_id));
    Promise.all(promises).then((data) => {
      console.log(data)
      res.send({court: data[0], user: data[1]});
    }).catch((err) => {
      console.log('err /courtsidePutUser in controller.js\n' +err)
    });
  })


  // Post:  User added to court's pNow, court added to user's courtside
  // Body params: ids of respective user and court
  // Sends: updated court and updated user
  router.delete('/courtsideDelete', (req, res, next) => {
    console.log(req.query.court_id + '\n' + req.query.user_id);
    let promises = [];
    promises.push(courtModel.courtsideDelete(req.query.court_id, req.query.user_id));
    promises.push(userModel.courtsideDelete(req.query.court_id, req.query.user_id));
    Promise.all(promises).then((data) => {
      console.log(data)
      res.send({court: data[0], user: data[1]});
    }).catch((err) => {
      console.log('err /courtsidePutUser in controller.js\n' +err)
    });
  })


  router.post('/newUser', (req, res, next) => {
    console.log(req.body.user.nName);
    userModel.newUser(req.body.user);
    next();
  })



  // last middlewear function
  router.all('/', function(req, res){
    res.send("catch all middlewear");
  })



module.exports = router;
