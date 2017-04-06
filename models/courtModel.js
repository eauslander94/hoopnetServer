var mongoose = require('mongoose');
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
  console.log()
  return "Here are all courts";
}
