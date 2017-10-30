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
  
  socket.on('joinroom', function ({ room, userId }) {
    console.log('SOCKET:', 'joinroom', { room, userId });
    
    // console.log('JOINROOM:', room, userId);
    socket.join(room);

    socketMatch.onJoinRoom(room, userId);

    io.to(room).emit('user-connected', 'USER CONNECTED');
  });

  //TODO: try to move these handlers to socketMatch (maw)
  // socket.on('active-table-position', async newActivePosition => {
  //   console.log('made it');
  // });
  socketMatch.onConnection(socket); // add match specific socket handlers
  
});