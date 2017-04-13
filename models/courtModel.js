var mongoose = require('mongoose');
var Promise = require('promise');
var events = require('events');
var fs = require('fs');
mongoose.connect('mongodb://localhost/test', function(error)
  { if(error) console.log(error) }  // log any errors
);

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


  //console.log(maxcy.name + " Court from db saved to javascript object");
  /*if(maxcy)
    console.log(maxcy)
  else console.log("maxcy is undefined");*/
  return "Here are all courts";
}

exports.eventEmitter = new events.EventEmitter();
//exports.eventEmitter.on('gotCourts', function(){console.log("WE HAVE COURTS  EVENTS BEING EMITTED")});
//exports.eventEmitter.emit('gotCourts');

var writableStream = fs.createWriteStream(
  '/home/guest/hoopnet/hoopnetServer/models/allCourts.json');

  //var readableStream = fs.createReadStream('/home/guest/hoopnet/hoopnetServer/file1.txt');
  //var writableStream = fs.createWriteStream('/home/guest/hoopnet/hoopnetServer/file2.txt');
  //readableStream.on('data', function(chunk) {
  //  console.log("stream data " + data)
  //});

gotCourts = function(courts){
  //console.log(courts[0]);
  writableStream.write(JSON.stringify(courts));
  exports.eventEmitter.emit('gotCourts');
  for (let court of courts)
    console.log(court.name + " lat: " + court.location.lat + " long: " + court.location.long);
}
