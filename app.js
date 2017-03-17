var express = require('express');
var app = express();

app.use(require('./controllers/courtState.js'));

app.listen(3000, function(){
  console.log('Listening on port 3000');
})
