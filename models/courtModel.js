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

  var query = Court.find({name: 'Maxcy Field House'}, function(err, courts){
    if (err) console.log(err);
  })

  var maxcy = query.exec(function(err, courts){
    if(err)
      return console.log(err);
    console.log(courts[0]);
  })

  console.log(maxcy.name + " Court from db saved to javascript object");
  //console.log(maxcy.name)
  return "Here are all courts";
}
