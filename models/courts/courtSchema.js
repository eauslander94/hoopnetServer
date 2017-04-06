// The following code connects to and communicates with mongo
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

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



// addTompkins
// To be calld only once, creates a court schema using dummy database
// and adds it to the test database
exports.addTompkins = function(){
  // creating a test court
  var fieldHouse = new Court({
    name: "Tompkins Square Park",
    totalPlayers: 18,
    totalBaskets: 4,
    location: {
      long: 73.981737,
      lat: 40.726526
    },
    basketArray: [
      { basketNo: 1, game: "5v", skillLevel: 88, wait: 3, physicality: 86, ballMovement: 72},
      { basketNo: 2, game: "5v", skillLevel: 88, wait: 3, physicality: 86, ballMovement: 72},
      { basketNo: 3, game: "1v", skillLevel: 66, wait: 0, physicality: 55, ballMovement: 55},
      { basketNo: 4, game: "2v", skillLevel: 83, wait: 1, physicality: 82, ballMovement: 95}
  ]})

    fieldHouse.save(function(err, fieldHouse) {
      if(err) return console.error(err);
    });
    console.log("Tompkins square park added to db");
}
