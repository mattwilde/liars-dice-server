
const socket = require('./socket');

// db access
var currentMatch = require('../db-access/current-match');

exports.onJoinRoom = async function (room, userId) {
  if (!room.startsWith('match ')) {
    return;
  }

  let matchId = room.substring('match '.length);
  let match = await currentMatch.getSingle({ '_id': matchId });

  // get index of user we are updating
  let user = null;
  let userIndex = -1;
  let users = match.users.filter(x => x._id === userId);
  if (users && users.length === 1) {
    user = users[0];
  }
  user.connection_status = 'connected';
  
  // property, id,  
  let response = await currentMatch.update({ '_id': matchId, 'users._id': userId }, { 'users.$.connection_status': 'connected' })
  if (response && response.ok === 1) {
    // socket.io.to(room).emit('match-joined', match); // return full match when user is connection to the match for the first time.
    socket.io.to(room).emit('match-user-connected', user); // return full user that just connected.
  }
  else {
    console.log('Failed to update user.');
  }
}