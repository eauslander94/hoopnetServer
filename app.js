var express = require('express');
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


app.use(cors())
app.use(require('./controllers/controller.js'));



app.listen(3000, function(){
  console.log('Listening on port 3000');
})
