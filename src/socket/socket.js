var app = require('../../app'); // required to have access to sockets.
var io = exports.io = app.get('io');
const socketMatch = require('./match');

exports.io.on("connection", socket => {
  console.log("New client connected");
  //TODO: Is there a way to check to see if a user has already connected? If so, we can kill the first connection
  //      and allow the new one to be used instead of both. (maw)

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
  
  socket.on('join-room', function (room) {
    console.log('SOCKET RECEIVE:', 'join-room', room);
    socket.join(room);
  });

  socketMatch.setEvents(socket); // add match specific socket events and listeners
});