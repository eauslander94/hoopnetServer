var mongoose = require('mongoose');
var Promise = require('promise');
var events = require('events');
var fs = require('fs');
mongoose.connect('mongodb://localhost/test', function(error)
  { if(error) console.log(error) }  // log any errors
);

var db = mongoose.connection;

/*var MongoClient = require('mongodb').MongoClient
MongoClient.connect('mongodb://localhost/test', function(err, db){
  if(err) console.log(err);
  else db.collection('courts').update({name: "Maxcy Field House" },{ $set: {totalPlayers: 40} })

})*/

var exports = module.exports = {}

// The Grand Schema of Things
var courtSchema = mongoose.Schema({
  name: String,
  totalPlayers: Number,
  totalBaskets: Number,
  location: {
    long: Number,
    lat: Number
  },

  basketArray: [{
    basketNo: Number,
    game: String,
    skillLevel: Number,
    wait: Number,
    physicality: Number,
    ballMovement: Number
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


// Returns: array of JSON Courts - all in db
exports.getAllCourts = function(){

// query the db, save the returned query to query
  var query = Court.find({}, function(err, courts){
    if (err) console.log(err);
  })
  var promise = query.exec();
  promise.then(function(courts){
    gotCourts(courts);
  })
  return "Here are all courts";
}

exports.eventEmitter = new events.EventEmitter();
//exports.eventEmitter.on('gotCourts', function(){console.log("WE HAVE COURTS  EVENTS BEING EMITTED")});
//exports.eventEmitter.emit('gotCourts');

var writableStream = fs.createWriteStream(
  '/home/guest/hoopnet/hoopnetServer/models/allCourts.json');

gotCourts = function(courts){
  //console.log(courts[0]);
  writableStream.write(JSON.stringify(courts));
  exports.eventEmitter.emit('gotCourts');
  for (let court of courts)
    console.log(court.name + " lat: " + court.location.lat + " long: " + court.location.long);
}



/*var tompkins = new Court({
  name: "Tompkins Square Park",
  totalPlayers: 22,
  totalBaskets: 4,
  location: {
    long: -73.981737,
    lat: 40.726526
  },
  basketArray: [
    { basketNo: 1, game: "5 v 5", skillLevel: 82, wait: 2, physicality: 88,  ballMovement: 73 },
    { basketNo: 2 , game: "5 v 5", skillLevel: 82, wait: 2, physicality: 88,  ballMovement: 73 },
    { basketNo: 3 , game: "4 v 4", skillLevel: 85, wait: 1, physicality: 70,  ballMovement: 81 },
    { basketNo: 4 , game: "3 v 3", skillLevel: 82, wait: 2, physicality: 88,  ballMovement: 73 },
  ]
})


tompkins.save(function(err, maxcy) {
  if(err) return console.error(err);
});*/
