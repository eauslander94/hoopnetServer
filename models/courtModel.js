var mongoose = require('mongoose');
var Promise = require('promise');
var events = require('events');
var fs = require('fs');
mongoose.Promise = require('bluebird');

// Connect to our db as admin with hardcoded credentials.
// We will adjust this when we complete our authentication cycle
mongoose.connect(
  'mongodb://user:K5a8Jxk9sSjCEJHVDRTcTZnghjs8SDSs@localhost:27017/Blacktop',
  //'mongodb://eauslander94:jordanSpliff90@localhost:27017/Blacktop',
  {useMongoClient: true},
  (error) => {
    if(error) console.log('err - mongoose.connect - courtModel.js\n' + error);
  }
);


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

  return Court.findOneAndUpdate(
    {_id: windowData.court_id},
    {$set: {windowData: windowData}},
    {new: true}
  ).exec();
}


// Post: user_id is added to windowData's pNow corresponding to court_id
// Params: the ids of the data to update
exports.courtsidePut = function(court_id, user_id){
  return Court.findOneAndUpdate(
    {_id: court_id},
    {$addToSet: {'windowData.pNow': user_id}},
    {new: true}
  ).exec();
}


// Post: user_id is removed from court_id's windowData's pNow
// Params: the ids of the court and user to update
exports.courtsideDelete = function(court_id, user_id){
  return Court.findOneAndUpdate(
    {_id: court_id},
    {$pull: {'windowData.pNow': user_id}},
    {new: true}
  ).exec();
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
  console.log('closure_id: ' + closure._id);

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
  openTimes: [String],
  closeTimes: [String],

  location: {
    type: {type: String},
    coordinates: [Number]
  },

  windowData: {
    baskets: Number,
    games: [String],
    gLastValidated: Date,
    action: String,
    actionDescriptor: String,
    aLastValidated: Date,
    court_id: String,
    pNow: [String],
  },
  closures: [{
    clStart: Date,
    clEnd: Date,
    reason: String,
    baskets: Number,
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


let jakeCribCourt = new Court({
  name: 'Jake\'s Crib Court',
  type: 'outdoor',
  baskets: 4,
  openTimes: ['6:00a', '6:00a', '6:00a', '6:00a', '6:00a', '6:00a', '6:00a'],
  closeTimes: ['11:00p','11:00p','11:00p','11:00p','11:00p','11:00p','11:00p'],

  location: {
    type: "Point",
    coordinates: [-73.942695, 40.850673]
  },

  windowData: {
    baskets: 4,
    games: ["5", "4", "2"],
    gLastValidated: new Date(),
    action: "Active",
    actionDescriptor: "continuous runs",
    aLastValidated: new Date(),
    // Update this from cmdline, if we need to. Command in in google drive under mongoDB reference guide
    court_id: "",
    pNow: []
  },

  closures: [],
});


// jakeCribCourt.save(function(err, jakeCribCourt) {
//   if(err) return console.error(err);
//   console.log('saving Jake\'s Crib Court')
// });
