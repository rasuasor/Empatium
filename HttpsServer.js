var static = require('node-static');
var https = require('https');
const fs = require('fs');
const config = require('./Config.js');

const options = {
    key: fs.readFileSync(config.HttpsOptions.key),
    cert: fs.readFileSync(config.HttpsOptions.cert)
}

// Create a node-static server instance
var file = new(static.Server)();
// We use the https module’s createServer function and
// rely on our instance of node-static to serve the files
var app = https.createServer(options, function (req, res) {
   file.serve(req, res);
   //res.setHeader("Feature-Policy", "camera 'self'; microphone 'self'");
}).listen(config.ServerPort);
// Use socket.io JavaScript library for real-time web applications
var io = require('socket.io').listen(app);


// Let's start managing connections...
io.sockets.on('connection', function (socket){


// Handle 'message' messages
 socket.on('message', function (message, room) {
 log('S --> got message: ', message);
 //log('S --> message.chanel: ', room);
 // channel-only broadcast...
 socket.broadcast.to(room).emit('message', message);
 //io.to(room).emit('message', message);
});


// Handle 'create or join' messages
socket.on('create or join', function (room) {

var numClients;

//var numClients = io.of('/').in(room).clients.length;



var clients = io.nsps["/"].adapter.rooms[room];

if (clients != null && clients != undefined)
{
    numClients = clients.length;
    log("S --> adapter.rooms: " + clients.length);
}
else
{
    numClients = 0; 
}

//log('S --> clients:' + io.of('/').in(room).clients.toString)

// io.of("/").in(room).clients((error, clients)=>{
//     numClients = clients.length;
//     log("S --> numClients: " + numClients)});

log('S --> Room ' + room + ' has ' + numClients + ' client(s)');
log('S --> Request to create or join room', room);
// First client joining...
if (numClients == 0){
socket.join(room);
socket.emit('created', room);
} else if (numClients == 1) {
// Second client joining...
io.sockets.in(room).emit('join', room);
socket.join(room);
socket.emit('joined', room);
} else { // max two clients
socket.emit('full', room);
}
});
function log(){
var array = [">>> "];
for (var i = 0; i < arguments.length; i++) {
array.push(arguments[i]);
}
socket.emit('log', array);
}
});