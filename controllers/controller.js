var express = require ('express');
var router = express.Router();
var courtModel = require('../models/courtModel.js');
var userModel = require ('../models/userModel.js');
var app = require('../app.js');
var fs = require('fs');
// For JWT authentication
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// set up realtime.co connection
var ortcNodeclient = require('ibtrealtimesjnode').IbtRealTimeSJNode;
// Create Messaging client
var ortcClient = new ortcNodeclient();
// Set Messaging client properties
ortcClient.setConnectionMetadata('clientConnMeta');
ortcClient.setClusterUrl('http://ortc-developers.realtime.co/server/2.1/');
// ortcClient.onDisconnected = function() {
//   console.log('disconnected');
// }

router.all('/', function(req, res, next) {
  console.log(req.method + " request recieved");
  res.type('text/plain');
  next();
})


  // Authentication middleware. When used, the
  // access token must exist and be verified against
  // the Auth0 JSON Web Key Set
  const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://eauslander94-dev.auth0.com/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    audience: 'https://courtlife.server.com',
    issuer: `https://eauslander94-dev.auth0.com/`,
    algorithms: ['RS256']
  });


  // Sends back an array of all courts in our db
  router.get('/getAllCourts', (req, res, next) => {

    console.log('fetching courts');
    courtModel.getAllCourts().then((courts) => {
      console.log('received courts from mLab database');
      // console.log(courts);
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

  router.get('/courtside', checkJwt, (req, res, next) => {

    // the range, below, is in METERS as we store locations as GeoJSON Points
    courtModel.courtsByLocation(JSON.parse(req.get('location')), 100)
    .then((courts) => {
      switch(courts.length){
        case 1:
          res.send({responseCode: 1, courts: courts});
          break;
        case 0:
        // get courts within 10 miles of location
          courtModel.courtsByLocation(JSON.parse(req.get('location')), 16000)
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
  router.get('/getUsers', checkJwt, function(req, res, next) {

    // Resolve the promise returned by the model
    userModel.getUsers(JSON.parse(req.get('user_ids'))).then((userArrays) => {
      // massage data into array of users, send it back
      let users = [];
      for(let user of userArrays)
        users.push(user[0]);
      res.send(users);
    }).catch((err) => {  next(err)  });
  })

  // Sends back an array of users
  // Param:  [String] - array of user ids of users to be fetched
  router.get('/windowGetUsers', (req, res, next) => {

    // Resolve the promise returned by the model
    userModel.getUsers(JSON.parse(req.get('user_ids'))).then((userArrays) => {
      // massage data into array of users, send it back
      let users = [];
      for(let user of userArrays)
        users.push(user[0]);
      res.send(users);
    }).catch((err) => {  next(err)  });
  })

  // Sends back a single user corresponding to the auth_id provided
  // If there is no user with that id it sends back {}
  router.get('/getUsersByAuth_id', checkJwt, (req, res, next) => {

    userModel.getUsersByAuth_id(req.get('auth_id')).then((user) => {

      // If there are no users, send theempty object.  Else send the user
      if (user.length === 0)
        res.send({});
      else res.send(user[0]);
    })
  })


  // Sends back an array of users that match the searchterm
  router.get('/getUsersByName', checkJwt, function(req, res, next) {

    userModel.getUsersByName(req.get('searchterm')).then((userArrays) => {
      // massage data into array of users, send it back
      let users = [];
      for(let user of userArrays)
        users.push(user[0]);
      res.send(users);
    }).catch((err) => {  next(err)  });
  });

  // Post: Queries db for courts which contain searchterm in their name
  // Returns: Array of courts
  // Param: 'searchterm' - string by which we query db
  router.get('/getCourtsByName', checkJwt, (req, res, next) => {
    console.log(req.get('searchterm'))
    courtModel.getCourtsByName(req.get('searchterm')).then((courts) => {
      console.log(courts);
      res.send(courts);
    }).catch((err) => {  next(err)  });;
  })


  // middlewear for refresh request
  // query params: name, lat and long of the court to be refreshed
  // post: response is sent with the latest version of the given court
  router.get('/refresh', function(req, res, next) {
    console.log("got refresh request");
    courtModel.refresh(req.query.courtName, req.query.lat, req.query.long);

      courtModel.eventEmitter.once('gotOneCourt', function(court){
        res.send(court);
      })
  })


  // Post: provided windowData replaces corresponding windowData in db
  // Post in the future - socket sends out blast that this window has been updated
  router.put('/scout', checkJwt, function(req, res, next) {

    console.log("players array " + JSON.stringify(req.body.windowData.players));

    let promises = [
      courtModel.putWindowData(req.body.windowData),
      userModel.checkIn(req.body.windowData.court_id, req.body.user_id)
    ];

    Promise.all(promises).then((data) => {

      res.send({
        court: data[0],
        user: data[1]
      })

      // connect to the messaging webhook, send out updated window data
      ortcClient.connect('pLJ1wW', 'testToken');
      ortcClient.onConnected = function(ortc){
        ortcClient.send('windowUpdate' + data[0].windowData.court_id,
          JSON.stringify(data[0].windowData)
        );
        ortcClient.disconnect();
      }

    }).catch((err) => {  next(err)  });
  })


  // Post: User in db is replaced with given user
  // Returns: updated user object
  router.put('/putUser', checkJwt, (req, res, next) => {

    userModel.putUser(req.body.user).then((user) => {
      res.send(user);
    }).catch((err) => {  console.log(err);  next(err)  });
  })


  // Post: Sends back array of updated users, starting withuser 1
  router.put('/confirmFriendRequest', checkJwt, (req, res, next) => {

    userModel.confirmFriendRequest(req.body.user1, req.body.user2).then((users, err) => {
      if (err) throw err;
      console.log(users[2].fName);
      res.send([users[2], users[3]]);
    }).catch((err) => { console.log(err);  next(err)  });
  })


  // RequestedUser added to currentUser's friend requests
  router.put('/requestFriend', checkJwt, (req, res, next) => {

    userModel.requestFriend(req.body.requestedUser, req.body.currentUser)
     .then(() => { res.send({}) })
     .catch((err) => { console.log(err);  next(err)  });
  })


  // Sends back an array of the updated users, ser1 in position 0;
  router.put('/removeFriend', checkJwt, (req, res, next) => {

    userModel.removeFriend(req.body.user1, req.body.user2).then((users) =>{
      res.send([users[0], users[1]])
    }).catch((err) => {
      console.log('error in controller.js /removeFriend ' + err);
      next(err);
    })
  })

  // Post: Provided court_id is added to homecourt list of provided user_id
  // In English, user gets a new homecourt
  // Param: court_id and user_id
  // Sends back: Updated user object
  router.put('/putHomecourt', checkJwt, (req, res, next) => {

    userModel.putHomecourt(req.body.user_id, req.body.court_id).then((user) => {
      res.send(user);
    }).catch((err) => {
      console.log('error in controller.js /putHomecourt ' + err);
      next(err);
    });
  })


  // Post:  User added to court's players
  // Body params: ids of respective user and court
  // Sends: updated court and updated user
  router.put('/checkIn', checkJwt, (req, res, next) => {

    let promises = [];
    promises.push(courtModel.checkIn(req.body.court_id, req.body.user_id));
    promises.push(userModel.checkIn(req.body.court_id, req.body.user_id));
    Promise.all(promises).then((data) => {

      res.send({court: data[0], user: data[1]});
    }).catch((err) => {
      console.log('err /checkIn in controller.js\n' +err)
    });
  })


  // Post: closure provided updates the version of it currently in db
  // Param: The closure to be updated
  // Sends updated court object
  router.put('/putClosure', checkJwt, (req, res, next) => {

    courtModel.putClosure(req.body.closure, req.body.court_id).then((data) => {
      console.log(data[1].closures)
      res.send(data[1]);
    }).catch((err) => {
      console.log('err /putClosure in controller.js\n' +err)
    });
  })

  // Logs the message to the console, moves on
  router.put('/serverLog', (req, res, next) => {
    console.log(req.body.message);
    next();
  })


  router.post('/newUser', checkJwt, (req, res, next) => {
    console.log('new User')
    userModel.newUser(req.body.user);
    next();
  })

  // Post: new closure is added to closures of provided court
  // Param: the closure to be added and the court to wich it will be added
  // Sends back updated court
  router.post('/postClosure', checkJwt, (req, res, next) => {

    courtModel.postClosure(req.body.closure, req.body.court_id).then((court) => {
      console.log(court.closures);
      res.send(court);
    }).catch((err) => {
      console.log('err /postClosure in controller.js\n' +err)
    });
  })



  // Post: Closure  provided is removed from the db
  // Param: _id of the closure to be deleted
  // Sends back updated court
  router.delete('/deleteClosure', checkJwt, (req, res, next) => {

    courtModel.deleteClosure(req.get('closure_id'), req.get("court_id"))
    .then((court) => {
      res.send(court);
    }).catch((err) => {
      console.log('err /deleteClosure in controller.js\n' +err)
    });
  })



  // last middlewear function
  router.all('/', function(req, res){
    res.send("catch all middlewear");
  })



module.exports = router;
