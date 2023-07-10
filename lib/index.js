var bodyParser      = require('body-parser');
var ws              = require('ws');
var express         = require('express');
const path          = require("path");
var multer          = require('multer');
const { type }      = require('os');
var upload          = multer();
var app             = express();

var response        = "";
var connections     = {"idle": [], 'butler': []};
var persistent_groups = new Array('idle', 'butler')
var instructions    = "";

class Bot {
    constructor(id, currentPos, group_id=0) {
        this.id           = id;
        this.group_id     = group_id;
        this.currentPos   = currentPos;
        this.groupPos     = [0,0,0];
        this.instructions = new Array();
        this.groupChange  = false;
    };

    setLabel(label) {
        this.instructions.push(`shell,${label}-${this.id}')`);
    }
  
    forward() {
        this.instructions.push("turtle.forward()");
        this.groupPos[2] ++;
    };

    dig() {
        this.instructions.push("turtle.dig()");
    };

    digUp() {
        this.instructions.push("turtle.digUp()");
    };

    digDown() {
        this.instructions.push("turtle.digDown()");
    };


  
    quarryInstructions(quarry) {
        var run = true
        while (run) {
            try {
                if (!(quarry[this.groupPos[0]][this.groupPos[1]][this.groupPos[2]+1] == undefined) ) {
                    this.dig();
                } else {
                    run = false;
                };
                    
            } catch (TypeError) {"no block in front"};
            try {
                if (!quarry[this.groupPos[0]][this.groupPos[1]+1][this.groupPos[2]]) {
                    this.digUp()};
            } catch (TypeError) {console.log("no block above", this.groupPos)};
            try {
                if (quarry[this.groupPos[0]][this.groupPos[1]-1][this.groupPos[2]]) {
                    this.digDown()};
            } catch (TypeError) {console.log("no block below")};
            this.forward();
            
        };
        return true
    };
};

function generate3DGrid(point1, point2) {
    // Calculate the min and max for each dimension
    console.log(point1, point2)
    let minX = Math.min(point1[0], point2[0]);
    let maxX = Math.max(point1[0], point2[0]);
    
    let minY = Math.min(point1[1], point2[1]);
    let maxY = Math.max(point1[1], point2[1]);

    let minZ = Math.min(point1[2], point2[2]);
    let maxZ = Math.max(point1[2], point2[2]);

    // Initialize the 3D grid
    let grid = new Array(maxX - minX + 1).fill(0).map(() => 
        new Array(maxY - minY + 1).fill(0).map(() => 
            new Array(maxZ - minZ + 1).fill(0)
        )
    );

    // Iterate over the x, y and z dimensions
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            for (let z = minZ; z <= maxZ; z++) {
                // Add the current coordinate to the grid
                grid[x-minX][y-minY][z-minZ] = [x, y, z];
            };
        };
    };

    return grid;
};

  
// Function to assign blocks to bots
function assignBlocksToBots(name, quarry, debug=false) {
    numBots = quarry.length*(Math.ceil((quarry[0].length-1)/3));
    connections[name] = []
    
    // const bots = [];
    // for(let i = 0; i < numBots; i++) {

    //below all values need to be added to current pos for the go to coord function. *******
    //     bots.push(new Bot(i, [i%quarry.length, ((Math.floor(i/quarry.length))*3)+1, 0]));
        
    // };
    // console.log("quarry",quarry);
    // console.log("quarry",quarry);
    // console.log("quarry[0]",quarry[0]);
    console.log("Number of bots needed",numBots)
    try {
        var counter = 0;
        console.log(connections.idle)
        Object.keys(connections.idle).forEach(id => {
            console.log(id)
            connections[name][id] = connections.idle[id];
            connections[name][id].group_id = counter;
            console.log("bot", id, "group_id", counter);

            var bot = connections[name][id];
            console.log("bot",bot);

            bot.setLabel(name);
            bot.groupPos = [counter%quarry.length, ((Math.floor(counter/quarry.length))*3)+1, 0];
            console.log("worked?",bot.quarryInstructions(quarry));

            bot.setLabel("idle");
            console.log("Bot",id,"instructions",bot.instructions);
            counter ++;
            console.log("current Number of bots", counter)
            if (counter == numBots) { throw new Error("Max limit reached");};
        });
    } catch (error) {
        console.log("error", error);
    };

    if (debug) {
        for (let x=0; x < quarry.length; x++) {
            console.log("quary[x]",quarry[x])
            for (let y=0; y < quarry[x].length; y++) {
                // console.log("quarry[y]", quarry[x][y])
                for (let z=0; z < quarry[x][y].length; z++) {
                    
                };
            };
        };
    };
};


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
// console.log(typeof Object.keys(connections[group]))

// Routes Definitions
app.get("/", (req, res) => {
    res.render("index", { title: "Home", groupKeys: Object.keys(connections), groups: connections });
});

app.post('/', function(req, res){
    console.log(req.body);
    // response = req.body.function

    res.render("index", { title: "Home", groupKeys: Object.keys(connections), groups: Object.keys(connections[req.body.active_group]) });
    
    if (!(req.body.modifier == undefined)) {
        console.log("modifier")
        if (req.body.modifier == "clear") {
            connections[group][(req.body.active_turtle)].instructions = new Array()
        };
    } else if (!(req.body.action == undefined)) {
        console.log("action")
        instructions = req.body.action
        
    } else if (!(req.body.function == undefined)) {
        if (req.body.function == "quarry") {
            console.log(req.body.start_coord, req.body.end_coord)
            var s = [-3966, 57, 2423]
            var e = [-3967, 58, 2426]
            var grid = generate3DGrid(s, e);
            assignBlocksToBots(req.body.new_group, grid, true);
        };
        
    } else if (!(req.body.custom_action == "")) {
        instructions = req.body.custom_action
    };

    if (!(instructions == "")) {
        console.log("pushing to instructions");
        // console.log(connections[req.body.active_group])
        connections[req.body.active_group][(req.body.active_turtle)].instructions.push(instructions)
        // console.log(connections[req.body.active_group][req.body.active_turtle].instructions)
        instructions = ""
    }
});


// Server Activation
var httpserver = app.listen(3292);
var wss = new ws.WebSocketServer({ server: httpserver });


wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
  
    ws.on('message', function message(data) {
        var stringData  = data.toString();
        var splitData   = stringData.split(",");
        var tempSplit   = splitData[0].split("-");
        var group       = tempSplit[0];
        var id          = parseInt(tempSplit[1]);
        var x           = splitData[1];
        var z           = splitData[2];
        var y           = splitData[3];
        if ( !(id in connections[group])){
            console.log("id", id, "added to", group)
            connections[group][id] = new Bot(id,new Array(x, y, z));
        } else {
            connections[group][id].currentPos = new Array(x, y, z);
            
            
            if ((connections[group][id].instructions == []) && !(persistent_groups.includes(group))) {
                console.log("weird shit check")
                connections[group][id].setLabel("idle");
            };
            // console.log(connections)
            // console.log("Instructions: ",connections[group][id].instructions)
            
            if (!(connections[group][id].instructions.length == 0)) { 
                // console.log("groupchange",connections[group][id].groupChange)
                response = connections[group][id].instructions.shift();
                // if (connections[group][id].groupChange) {
                //     delete connections.idle[id];
                // };
            }
        };
        // console.log('received: %s', data);
        // console.log("connections[group]: %s", connections[group][id].currentPos);
        // console.log("connections[group] instructions: %s", connections[group][id].instructions)
        // console.log(!(id in connections[group]))
        // console.log(!(connections[group][id].instructions.length == 0))
        console.log("SENDING %s:",response)
        // console.log(connections[group][id].instructions)
        // console.log(id)
        ws.send(response);
        response = "";
        
    });
    

}); 