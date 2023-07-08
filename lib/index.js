// app.js
// import { WebSocketServer } from 'ws';
var bodyParser      = require('body-parser');
var ws              = require('ws');
var express         = require('express');
const path          = require("path");
var multer          = require('multer');
const { type }      = require('os');
var upload          = multer();
var app             = express();

var response        = "";
var connections     = {};

// function quarry () {


// }



// var interface = {
//     "forward"       : 'turtle.forward()',
//     "back"          : 'turtle.back()',
//     'turnLeft'      : 'turtle.turnLeft()',
//     'turnRight'     : 'turtle.turnRight()',
//     'up'            : 'turtle.up()',
//     'down'          : 'turtle.down()',
//     'quarry'        : 
// }






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
// console.log(typeof Object.keys(connections))

// Routes Definitions
app.get("/", (req, res) => {
    res.render("index", { title: "Home", turtles: Object.keys(connections) });
});

app.post('/', function(req, res){
    console.log(req.body);
    // response = req.body.function
    console.log("pushing to instructions")
    connections[(req.body.active_turtle)].instructions.push(req.body.function)
});


// Server Activation
var httpserver      = app.listen(3292);
var wss = new ws.WebSocketServer({ server: httpserver });


wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
  
    ws.on('message', function message(data) {
        var stringData  = data.toString();
        var splitData   = stringData.split(",");
        var name        = splitData[0]
        var x           = splitData[1]
        var y           = splitData[2]
        var z           = splitData[3]
        if ( !(name in connections)){
            connections[name]                   = {};
            connections[name]["ws"]             = ws;
            connections[name]["instructions"]   = [];
            connections[name]["pos"]            = {};
            connections[name]["pos"]["x"]       = x;
            connections[name]["pos"]["y"]       = y;
            connections[name]["pos"]["z"]       = z;
            // {"instructions":[], "pos":{"x":0,"y":0,"z":0}};
        } else {
            connections[name]["pos"]["x"] = x;
            connections[name]["pos"]["y"] = y;
            connections[name]["pos"]["z"] = z;
            // console.log("LENGTH check: %s", !(connections[name].instructions.length == 0))
            if (!(connections[name].instructions.length == 0)) { 
                response = connections[name].instructions[0];
                // ws.send(response);
                connections[name].instructions.shift();
            }
        }
        // console.log('received: %s', data);
        // console.log("connections: %s", connections)
        // console.log("connections instructions: %s", connections[name].instructions)
        // console.log(!(name in connections))
        // console.log(!(connections[name].instructions.length == 0))
        // console.log("SENDING %s:",response)
        ws.send(response);
        response = ""
        
    });
    

}); 