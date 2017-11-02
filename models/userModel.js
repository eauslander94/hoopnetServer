var mongoose = require('mongoose');
var events = require('events');
var Promise = require ('promise');
mongoose.Promise = require('bluebird');


// Connect to our db as admin with hardcoded credentials.
// We will adjust this when we complete our authentication cycle
mongoose.createConnection('mongodb://eauslander94:jordanSpliff90@localhost:27017/Blacktop', {poolsize: 2}, (error) => {
  if(error) console.log(error);
});

// Our connection in an object
var db = mongoose.connection;
// So that we can export model behavior
var exports = module.exports = {}


// Returns:  Single promise which resolves into an array of arrays of users
// Param: user_ids: Array of string ids corresponding to users to be fetched
exports.getUsers = function(user_ids){
  // set up our array of promises for our promise.all call, return the bitch
  let userPromises = [];
  for(let id of user_ids)
    userPromises.push(User.find({'_id': id}));
  return Promise.all(userPromises);
}

// Post:  entire user object in db is replaced by provided user
// Returns: Promise resolving in the updated user oject
exports.putUser = function(user){
  return User.findOneAndUpdate(
    {_id: user._id},
    { $set:
      {
        nName: user.nName,
        fName: user.fName,
        lName: user.lName,
        homeCourts: user.homeCourts,
        friends: user.friends,
        friendRequests: user.friendRequests,
        avatar: user.avatar,
        backgroundImage: user.backgroundImage,
        courtside: user.courtSide,
      }
    },
    {new: true}
  ).exec();
}


// Post: both users are added to the friends[] of the other
// Post2:  both users are removed from friendRequests[] of the other, if present
// Params: ids of users to be added
// Returns: promise.all promise, resolving to an array like following:
// [updateStatus, updateStatus, updatedUser1object, updatedUser2object]
exports.addFriend = function(id1, id2){
  let promises = [];
  promises.push(User.update({_id: id1}, { $pull: {friendRequests: id2}}).exec());
  promises.push(User.update({_id: id2}, { $pull: {friendRequests: id1}}).exec());

  promises.push(User.findOneAndUpdate(
    {_id: id1},
    { $addToSet: {friends: id2} },
    {upsert: true, new: true}
  ).exec());
  promises.push(User.findOneAndUpdate(
    {_id: id2},
    { $addToSet: {friends: id1} },
    {upsert: true, new: true}
  ).exec());

  return Promise.all(promises);
}







// The grand schema of things (kill me later)
var userSchema = mongoose.Schema({
  fName: String,
  nName: String,
  lName: String,
  // An array of pointers to court objects
  homecourts: [String],
  // An array of pointers to user objects
  friends: [String],
  // Another array of pointers to user objects
  friendRequests: [String],
  avatar: {data: Buffer, contentType: String},
  backgroundImage: {data: Buffer, contentType: String},
  // Pointer to the court the user is beside
  courtside: String
});

// The model of the schema above
var User = mongoose.model('User', userSchema);

let eli = new User({
    fName: "Eli",
    nName: "White Iverson",
    lName: "Auslander",

    // Leave things as empty for now
    homecourts: [],
    friends: [],
    friendRequests: [],
    avatar: {data: '', contentType: ''},
    backgroundImage: {data: '', contentType: ''},
    courtside: '',
  })

  // eli.save(function(err, eli) {
  //   if(err) console.error(err);
  //   console.log('eli saved');
  // });

 let steph = new User({
     fName: "Steph",
     nName: "",
     lName: "Curry",

     // Leave things as empty for now
     homecourts: [],
     friends: [],
     friendRequests: [],
     avatar: {data: '', contentType: ''},
     backgroundImage: {data: '', contentType: ''},
   })

    // steph.save(function(err, steph) {
    //   if(err) return console.error(err);
    //   console.log('steph saved');
    // });
