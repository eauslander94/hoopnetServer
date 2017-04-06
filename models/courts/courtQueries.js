var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var exports = module.exports = {}

// Returns array of JSON Courts
exports.getAllCourts = function(){
  return "Here are all courts";
}
