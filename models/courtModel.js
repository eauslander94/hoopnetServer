var mongoose = require('mongoose');
var Promise = require('promise');
var events = require('events');
var fs = require('fs');
mongoose.Promise = require('bluebird');

// Connect to our db as admin with hardcoded credentials.
// We will adjust this when we complete our authentication cycle
mongoose.connect(
  // Connection with hosted mLab db
  'mongodb://eauslander94:jordanSpliff90@ds119078.mlab.com:19078/blacktop',

  // Connection with local db as regular user
  //'mongodb://user:K5a8Jxk9sSjCEJHVDRTcTZnghjs8SDSs@localhost:27017/Blacktop',

  // Connection with local db as super user
  //'mongodb://eauslander94:jordanSpliff90@localhost:27017/Blacktop',
  {useMongoClient: true},
  (error) => {
    if(error) console.log('err - mongoose.connect - courtModel.js\n' + error);
  }
).then(() => {
  console.log('connected using .connect courtModel');
});


var db = mongoose.connection;
var exports = module.exports = {}


// Returns: array of JSON Courts - all in db
exports.getAllCourts = function(){
  return Court.find({}).exec();
}


// Returns: Promise resolving into an array of fetched court objects
// Param:  The ids of the courts to be fetched
exports.getCourtsById = function(court_ids){
  let promises = [];
  for(let court_id of court_ids)
    promises.push(Court.find({_id: court_id}).exec());
  return Promise.all(promises);
}


// Returns: Promise resolving to array of courts which contain searchterm in the name
// Param:   Term to search by
exports.getCourtsByName = function(searchterm){
  return Court.find({"name" : { "$regex": searchterm, "$options": "i" }}).exec()
}

// Returns: promise resolving to array of courts within the courtside distance
// Param: location the following format - [lng, lat]
// Param: The range(in meters) from courts to location
exports.courtsByLocation = function(location, range){
  return Court.find(
    { location:
      { $near:
        { $geometry: { type: "Point",  coordinates: location },
          $maxDistance: range
        }
      }
  }).exec();
}
// REMEMBER: A geospacial query needs an index on the court model.
// The following did the trick: db.courts.createIndex({location: '2dsphere'})



// Post:  Provided window Data replaces corresponding windowData in db
// Param: WindowData to be used as the update
// Returns: Promise resolving this court with the updated windowData
exports.putWindowData = function(windowData){

  console.log("players in courtModel: " + windowData.players);

  return Court.findOneAndUpdate(
    {_id: windowData.court_id},
    {$set: {windowData: windowData}},
    {new: true}
  ).exec();
}


// Post: user_id is added to windowData's pNow corresponding to court_id
// Params: the ids of the data to update
exports.checkIn = function(court_id, user_id){

  return Court.findOne({_id: court_id}, (err, court) => {

    if(err) return err;

    // if user is already in players array remove her
    if(court.windowData.players.indexOf(user_id) > -1)
      court.windowData.players.splice(court.windowData.players.indexOf(user_id), 1)
    // add user to beginning of array
    court.windowData.players.unshift(user_id);
    // if more than 50 players, remove te last one
    if(court.windowData.players.length > 50)
      court.windowData.players.splice(court.windowData.players.length - 1, 1)

    // save the court, give controller the promise returned by Model.save
    return court.save();
  }
);

}


// Post: Closure whose id is provided is removed from the db
// Param: _id of the closure to be deleted
// Returns: Promise resolving to updated court
exports.postClosure = function(closure, court_id){

  return Court.findOneAndUpdate(
    {_id: court_id},
    {$addToSet: {closures: closure}},
    {new: true}
  ).exec();
}

// Post: closure provided updates the version of it currently in db
// Param: The closure to be updated
// Returns: Promise resolving to updated
exports.putClosure = function(closure, court_id){
  console.log('court_id: ' + court_id);
  console.log(closure.baskets);

  let promises = []
  // Remove the old closure
  promises.push(Court.findOneAndUpdate(
    {_id: court_id},
    {$pull: {closures: {_id: closure._id} }},
    {new: true}
  ).exec());
  // Add the new Closure
  promises.push(Court.findOneAndUpdate(
    {_id: court_id},
    {$addToSet: {closures: closure}},
    {new: true}
  ).exec());

  return Promise.all(promises);
}

// Post:    Closure whose id is provided is removed from the db
// Param:   _id of the closure to be deleted
// Returns: Promise resolving to updated court object
exports.deleteClosure = function(closure_id, court_id){
  return Court.findOneAndUpdate(
    {_id: court_id},
    {$pull: {closures: {_id: closure_id} }},
    {new: true}
  ).exec();
}


// The Grand Schema of Things (Sorry)
var courtSchema = mongoose.Schema({
  name: String,
  type: String,
  baskets: Number,
  // Sunday at position 0, saturday position 6
  openTimes: [Date],
  closeTimes: [Date],

  location: {
    type: {type: String},
    // [lng, lat]
    coordinates: [Number]
  },

  windowData: {
    baskets: Number,
    games: [String],
    gLastValidated: Date,
    waitTime: String,
    wLastValidated: Date,
    court_id: String,
    players: [String],
  },
  closures: [{
    clStart: Date,
    clEnd: Date,
    reason: String,
    baskets: Number,
    // array of numbers(sunday = 0), where a value of 1 or 2 means closure is in effect that day
    days: [Number],
    repeat: Boolean,
  }]
});


// The model of the schema above
var Court = mongoose.model("Court", courtSchema);


// function putOneGame
// post: the new game 'game' is added to the given court at the given basket
exports.putOneGame = function(court, basketNo, game){

  db.collection('courts').update(
    {name: court.name, "basketArray.basketNo": basketNo}, // selects the basket
    { $set: {"basketArray.$.game": game} }
  )
}

// function refresh()
// param: name - name of the court to be refreshed
//        lat - court's latitude
//        long - court's longitude
// returns: court object representing the latest version of the given court
exports.refresh = function(name, lat, long){
  let courtQuery = Court.find({'name': name, 'location.lat': lat, 'location.long': long },
    // We have one court!
    function(err, courts){
      if(err) {
        console.log(err);
      }
      else{
        exports.eventEmitter.emit("gotOneCourt", courts[0])
      }
    })
}


exports.eventEmitter = new events.EventEmitter();

let open = new Date();
open.setHours(7);
open.setMinutes(0);
let closed = new Date();
closed.setHours(22);
closed.setMinutes(0);

let newCourt = new Court({
  name: "",
  type: 'outdoor',
  baskets: 5,
  openTimes: [open, open, open, open, open, open, open],
  closeTimes: [closed, closed, closed, closed, closed, closed, closed],

  location: {
    type: "Point",
    coordinates: [-73.931992, 40.804264]
  },

  windowData: {
    baskets: 5,
    games: ["5", "4", "4"],
    gLastValidated: new Date(),
    // Spaces on wait time
    waitTime: "2 - 3",
    wLastValidated: new Date(),
    // Update this from cmdline, if we need to. Command in in google drive under mongoDB reference guide
    court_id: "",
    players: []
  },

  closures: [],
});


// newCourt.save(function(err, newCourt) {
//   if(err) return console.error(err);
//   console.log('saving ' + newCourt.name)
// });

// db.courts.update({"_id" : ObjectId("5ace43b4d718e138f343a4dd")}, {$set: {"windowData.court_id": "5ace43b4d718e138f343a4dd"}})
