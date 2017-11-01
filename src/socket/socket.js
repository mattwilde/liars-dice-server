const jwt = require('jsonwebtoken');
const User = require('mongoose').model('User');
var app = require('../../app'); // required to have access to sockets.
var io = exports.io = app.get('io');
var socketMatch = require('./match');

exports.io.on("connect", socket => {
  // decode the token using a secret key-phrase
  jwt.verify(socket.handshake.query.token, process.env.LIARS_DICE_JWT_SECRET, (err, decoded) => {
    if (err) { 
      socket.disconnect('unauthorized');
      return; 
    }

    const userId = decoded.sub;

    // check if a user exists
    return User.findById(userId, (userErr, user) => {
      if (userErr || !user) {
        socket.disconnect('unauthorized');
        return;
      }
    });
  });
});

exports.io.on("connection", socket => {
  if (socket.disconnected) {
    console.log("User unauthorized");
  }
  else {
    console.log("New client connected");
  }
  //TODO: Is there a way to check to see if a user has already connected? If so, we can kill the first connection
  //      and allow the new one to be used instead of both. (maw)
  
  // socket.use((packet, next) => {
  //   console.log('SOCKET MIDDLEWARE:', packet);
  //   return next();
  // });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
  
  socket.on('join-room', function (room) {
    console.log('SOCKET RECEIVE:', 'join-room', room);
    socket.join(room);
  });
  
  socketMatch.setEvents(socket, io); // add match specific socket events and listeners
});
