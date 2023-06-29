// app.js
// import { WebSocketServer } from 'ws';
var bodyParser      = require('body-parser');
var ws              = require('ws');
var express         = require('express');
const path          = require("path");
var multer          = require('multer');
var upload          = multer();
var app             = express();
var response        = {}

// this will make Express serve your static files
app.use(express.static(__dirname + '/public'));


app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');

 
// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 
//form-urlencoded

// for parsing multipart/form-data
app.use(upload.array()); 
app.use(express.static('public'));


// Routes Definitions
app.get("/", (req, res) => {
    res.render("index", { title: "Home" });
});

app.post('/', function(req, res){
    console.log(req.body);
    
    
    response = req.body;
    // ws.send(req.body)
});



// Server Activation
var httpserver      = app.listen(3292);
var wss = new ws.WebSocketServer({ server: httpserver });


wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
  
    ws.on('message', function message(data) {
        console.log('received: %s', data);
    });
    
    
    ws.send(response.function);
    response = {}

  }); 