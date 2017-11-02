var mongoose = require('mongoose');
var Promise = require('promise');
var events = require('events');
var fs = require('fs');
mongoose.Promise = require('bluebird');

// Connect to our db as admin with hardcoded credentials.
// We will adjust this when we complete our authentication cycle
mongoose.connect('mongodb://eauslander94:jordanSpliff90@localhost:27017/Blacktop', {poolsize: 2}, (error) => {
  if(error) console.log(error);
});


var db = mongoose.connection;


var exports = module.exports = {}


// Returns: array of JSON Courts - all in db
exports.getAllCourts = function(){
  return Court.find({}).exec();
}

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


// The Grand Schema of Things (I know)
var courtSchema = mongoose.Schema({
  name: String,
  type: String,
  baskets: Number,
  openTimes: [String],
  closeTimes: [String],

  location: {
    lat: Number,
    lng: Number
  },

  windowData: {
    court_id: String,
    baskets: Number,
    games: [String],
    gLastValidated: Date,
    action: String,
    actionDescriptor: String,
    aLastValidated: Date,
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


let tompkins = new Court({
  name: 'Tompkins Square Park',
  type: 'outdoor',
  baskets: 4,
  openTimes: ['6:00a', '6:00a', '6:00a', '6:00a', '6:00a', '8:00a', '8:00a'],
  closeTimes: ['11:00p','7:00p','11:00p','11:00p','11:00p','10:30p','8:00p'],

  location: {
    lat: 40.726429,
    lng: -73.981784,
  },

  windowData: {
    baskets: 4,
    games: ["5", "4", "2"],
    gLastValidated: new Date(),
    action: "Active",
    actionDescriptor: "continuous runs",
    aLastValidated: new Date(),
    pNow: []
  },

  closures: [
    {
      clStart: new Date(10),
      clEnd: new Date(12),
      reason: "3 on 3 Tournament",
      baskets: 4,
      // sunday(index 0) to saturday(index 6) -
      // 1 in the index means closure is on that day
      // 2 in the index means it repeats every week on that day
      days: [1, 0, 0, 0, 0, 0, 2],
      repeat: false
    },
      {clStart: new Date(16),
      clEnd: new Date(18),
      reason: "Mens Soccer Practice",
      baskets: 4,
      days: [2, 0, 0, 0, 0, 2, 0],
      repeat: true
    },
    {
      clStart: new Date(16),
      clEnd: new Date(18),
      reason: "Mens Basketball Practice",
      baskets: 4,
      days: [1, 0, 0, 0, 0, 0, 1],
      repeat: true
    },
    {
      clStart: new Date(16),
      clEnd: new Date(18),
      reason: "Girls Soccer Practice",
      baskets: 4,
      days: [2, 0, 0, 0, 0, 0, 1],
      repeat: true
    }
  ],
});

// Court.create(tompkins, (err, tompkins) => {
//   if(err) console.log(err);
// })

//var Tompkins = new Court(tompkins);

// tompkins.save(function(err, tompkins) {
//   if(err) return console.error(err);
//   console.log('saving tompkins')
// });

// console.log('saved Tompkins');
