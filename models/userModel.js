var mongoose = require('mongoose');
var events = require('events');
var Promise = require ('promise');
mongoose.Promise = require('bluebird');


// Connect to our db as admin with hardcoded credentials.
// We will adjust this when we complete our authentication cycle
mongoose.connect(
  'mongodb://eauslander94:jordanSpliff90@localhost:27017/Blacktop',
  {useMongoClient: true},
  (error) => {
    if(error) console.log('err - mongoose.connect - userModel.js\n' + error);
  }
);

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


// Returns: single promise which resolves into an array of users that match the searchterm
// Param: searchterm - term by which we search for users
exports.getUsersByName = function(searchterm){
  searchterm = searchterm.replace(/\s+/g, '');
  return User.aggregate(
    [
      { $project: { fullName: { $concat: [ "$fName", '$nName', "$lName" ]}}},
      { $match: { fullName: { $regex: new RegExp(searchterm, 'i') } } }
    ]
  ).exec().then((users) => {
    let ids = [];
    for(let user of users)
      ids.push(user._id);
    return this.getUsers(ids);
  }).catch((err) => {return(err)});

  // Search without partial matching if the above has performance issues
  // return User.find({$text: {$search: searchterm}}, {$caseSensitive: true} ).exec();
}


// Post:  entire user object in db is replaced by provided user
// Param: User to replace user in db
// Returns: Promise resolving in the updated user oject
exports.putUser = function(user){
  return User.findOneAndUpdate(
    {_id: user._id},
    { $set:
      {
        nName: user.nName,
        fName: user.fName,
        lName: user.lName,
        homecourts: user.homecourts,
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


// Post:    both users are added to the friends[] of the other
// Post2:   both users are removed from friendRequests[] of the other, if present
// Params:  ids of users to be added
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


// Post:    current user added to requested user's friend requests
// Param:   ids of current user and requested user
// Retruns: promise resolving to the updated requested user
exports.requestFriend = function(requestedUser, currentUser){
  return User.update({_id: requestedUser}, {$push:{friendRequests: currentUser}}).exec();
}


// Post:    both users removed from friends[] of the other
// Params:  ids of the users who will no longer be friends.  So sad.
// Returns: Promise resolving to array of the updated users
exports.removeFriend = function(user1, user2){
  var promises = [];
  promises.push(User.findOneAndUpdate(
    {_id: user1},
    {$pull: {friends: user2}},
    {upsert: true, new: true}
  ).exec());
  promises.push(User.findOneAndUpdate(
    {_id: user2},
    {$pull: {friends: user1}},
    {upsert: true, new: true}
  ).exec());
  return Promise.all(promises);
}

// Post:    New user is added to users collection
// Param:   New user to be added
// Returns: Nothing
exports.newUser = function(user){
  console.log(user);
  User.create(user, function(err, user) {
     if(err) console.error(err);
   });
}


// Post:    given court id is added to user's courtside field
// Params:  ids of the user to be updated and court he/she is by
// Retruns: Promise resolving to updated user
exports.courtsidePut = function(court_id, user_id){
  return User.findOneAndUpdate(
    {_id: user_id},
    { $set: {courtside: user_id} },
    {upsert: true, new: true}
  ).exec();
}


// Post:    given court id is removed from user's courtside field
// Params:  ids of the user to be updated and court he/she is no longer by
// Retruns: Promise resolving to updated user
exports.courtsideDelete = function(court_id, user_id){
  return User.findOneAndUpdate(
    {_id: user_id},
    { $set: {courtside: null} },
    {upsert: true, new: true}
  ).exec();
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


// new user to be added
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
