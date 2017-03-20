var express = require('express');
var cors = require('cors');
var app = express();

app.use(cors())

app.use(require('./controllers/courtState.js'));

app.listen(3000, function(){
  console.log('Listening on port 3000');
})
