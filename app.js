var app = require('express')();

// Setup for our app
var cors = require('cors');
var bodyParser = require('body-parser');
 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors())
app.use(require('./controllers/controller.js'));

// Get our server going
var server = require('http').Server(app);

// For socket.io connection with client, exported to the controller
exports.io = require('socket.io')(server);

// listen on port 3000
server.listen(3000, function(){
  console.log('Listening on port 3000');
})
