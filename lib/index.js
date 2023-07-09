var bodyParser      = require('body-parser');
var ws              = require('ws');
var express         = require('express');
const path          = require("path");
var multer          = require('multer');
const { type }      = require('os');
var upload          = multer();
var app             = express();

var response        = "";
var connections     = {"idle": []};
var instructions    = "";

class Bot {
    constructor(id, currentPos) {
        this.id         = id;
        // this.group        = "Idle";
        this.currentPos   = currentPos;
        this.instructions = new Array();
    };
  
    forward() {
        this.instructions.push("turtle.forward()")
    };

    dig() {
        this.instructions.push("turtle.dig()")
    };

    digUp() {
        this.instructions.push("turtle.digUp()")
    };

    digDown() {
        this.instructions.push("turtle.digDown()")
    };
  
    sendInstructions(quarry) {
        try {
            quarry[this.currentPos[0]][this.currentPos[1]]
            while (quarry[this.currentPos[0]][this.currentPos[1]][this.currentPos[2]+1]) {
                this.dig();
                try {
                    if (quarry[this.currentPos[0]][this.currentPos[1]+1][this.currentPos[2]]) {
                        this.digUp()};
                } catch (TypeError) {};
                try {
                    if (quarry[this.currentPos[0]][this.currentPos[1]-1][this.currentPos[2]]) {
                        this.digDown()};
                } catch (TypeError) {};
                this.forward();

            };
        } catch (TypeError) {
            return false
        };
        return true
    };
};

function generate3DGrid(point1, point2) {
    // Calculate the min and max for each dimension
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
            }
        }
    }

    return grid;
}

  
// Function to assign blocks to bots
function assignBlocksToBots(quarry, debug=false) {
    numBots = quarry.length*(Math.ceil((quarry[0].length-1)/3))

    
    const bots = [];
    for(let i = 0; i < numBots; i++) {

        bots.push(new Bot(i, [i%quarry.length, ((Math.floor(i/quarry.length))*3)+1, 0]));
        
    };
    console.log("quarry",quarry);

    bots.forEach(bot => {
        console.log(bot.id, bot.currentPos);
        bot.sendInstructions(quarry);
        console.log(bot.instructions)
        console.log(bot.id, bot.currentPos);
    });

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
    
    console.log(req.body.active_group);
    res.render("index", { title: "Home", groupKeys: Object.keys(connections), groups: Object.keys(connections[req.body.active_group]) });
    console.log(req.body.modifer)
    if (!(req.body.modifier == undefined)) {
        console.log("modifier")
        if (req.body.modifier == "clear") {
            connections[group][(req.body.active_turtle)].instructions = new Array()
        };
    } else if (!(req.body.action == undefined)) {
        console.log("action")
        instructions = req.body.action
        
    } else if (!(req.body.function == '{"start": [], "end":[]}')) {
        if (req.body.function == "quarry") {

            var grid = generate3DGrid(req.body.coords.start, req.body.coords.end);
            assignBlocksToBots(grid);
        };
        
    } else if (!(req.body.custom_action == "")) {
        instructions = req.body.custom_action
    };

    if (!(instructions == "")) {
        console.log("pushing to instructions");
        connections[req.body.active_group][(req.body.active_turtle)].instructions.push(instructions)
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
        var group       = splitData[0];
        var id          = splitData[1];
        var x           = splitData[2];
        var y           = splitData[3];
        var z           = splitData[4];
        if ( !(id in connections[group])){
            connections[group][id]                      = new Bot(id,new Array(x, y, z));
            // connections[group][id]["instructions"]   = [];
            // connections[group][id]["pos"]            = {};
            // connections[group][id]["pos"]["x"]       = x;
            // connections[group][id]["pos"]["y"]       = y;
            // connections[group][id]["pos"]["z"]       = z;
            // {"instructions":[], "pos":{"x":0,"y":0,"z":0}};
        } else {
            // connections[group][id]["pos"]["x"] = x;
            // connections[group][id]["pos"]["y"] = y;
            // connections[group][id]["pos"]["z"] = z;
            // console.log("LENGTH check: %s", !(connections[group][id].instructions.length == 0))
            connections[group][id].currentPos = new Array(x, y, z);
            if (!(connections[group][id].instructions.length == 0)) { 
                response = connections[group][id].instructions.shift();
                // ws.send(response);
                // connections[group][id].instructions.shift();
            }
        }
        console.log('received: %s', data);
        // console.log("connections[group]: %s", connections[group])
        // console.log("connections[group] instructions: %s", connections[group][id].instructions)
        // console.log(!(id in connections[group]))
        // console.log(!(connections[group][id].instructions.length == 0))
        console.log("SENDING %s:",response)
        console.log(connections[group][id].instructions)
        // console.log(id)
        ws.send(response);
        response = ""
        
    });
    

}); 