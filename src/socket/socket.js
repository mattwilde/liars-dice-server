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
    console.log('JOINROOM:', room, userId);
    socket.join(room);

    socketMatch.onJoinRoom(room, userId);

    io.to(room).emit('user-connected', 'USER CONNECTED');
  });
});

  // module.auth = function (req, res) {
  //     // This will be available 'outside'.
  //     // Authy stuff that can be used outside...
  // };

  // // Other stuff...
  // module.pickle = function(cucumber, herbs, vinegar) {
  //     // This will be available 'outside'.
  //     // Pickling stuff...
  // };

  // function jarThemPickles(pickle, jar) {
  //     // This will be NOT available 'outside'.
  //     // Pickling stuff...

  //     return pickleJar;
  // };

//   return module;
// };