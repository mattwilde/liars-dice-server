
const socketIO = require('./socket');

// db access
var currentMatch = require('../db-access/current-match');

exports.setListeners = async function (socket) {
  /**
   * 
   * data: {
   *  matchId: current-match _id to join
   *  userId: user _id that is joining
   * }
   */
  socket.on('join-match', async data => {
    console.log('SOCKET:', 'join-match', data.matchId);

    let room = `match ${data.matchId}`;
    socket.join(room);

    let match = await currentMatch.getSingle({ '_id': data.matchId });
    // get index of user we are updating
    let user = null;
    let userIndex = -1;
    let users = match.users.filter(x => x._id === data.userId);
    if (users && users.length === 1) {
      user = users[0];
    }
    
    // make updates
    user.connection_status = 'connected';
    
    let response = await currentMatch.update({ '_id': data.matchId, 'users._id': data.userId }, { 'users.$.connection_status': 'connected' })
    
    if (response && response.ok === 1) {
    // push updates to client if updates were successful
      socketIO.io.to(room).emit('match-user-connected', user); // return full user that just connected.
      console.log('SOCKET EMIT TO ROOM:', room, 'match-user-connected', user);
      
      // check if we have everyone connected. if so, then push update to start game. Setting active_table_position to 1 should indicate
      // to the client to start the game.
      let updatedMatch = await currentMatch.getSingle({ '_id': data.matchId });
      if (updatedMatch.users.length === updatedMatch.users.filter(x => x.connection_status === 'connected').length) {
      
        let response = await currentMatch.update({ '_id': data.matchId }, { 'active_table_position': 1 });
        if (response && response.ok === 1) {
          socketIO.io.to(room).emit('active-table-position', 1); // return new active table position
          console.log('SOCKET EMIT TO ROOM:', room, 'active-table-position', 1);
          }
        else {
          console.log('Failed to update active_table_position.');
        }
      }
    }
    else {
      console.log('Failed to update user.');
    }
  });

  socket.on('active-table-position', async data => {
    console.log('SOCKET:', 'active-table-position', data);
    let response = await currentMatch.update({ '_id': data.matchId }, { 'active_table_position': data.activeTablePosition });
    if (response && response.ok === 1) {
      socketIO.io.to(`match ${data.matchId}`).emit('active-table-position', data.activeTablePosition); // return new active table position
      console.log('SOCKET EMIT TO ROOM:', `match ${data.matchId}`, 'active-table-position', data.activeTablePosition);
    }
    else {
      console.log('Failed to update active_table_position.');
    }
  });


}

// exports.onJoinRoom = async function (room, userId) {
//   if (!room.startsWith('match ')) {
//     return;
//   }

//   let matchId = room.substring('match '.length);
//   let match = await currentMatch.getSingle({ '_id': matchId });

//   // get index of user we are updating
//   let user = null;
//   let userIndex = -1;
//   let users = match.users.filter(x => x._id === userId);
//   if (users && users.length === 1) {
//     user = users[0];
//   }
//   // make updates
//   user.connection_status = 'connected';
  
//   let response = await currentMatch.update({ '_id': matchId, 'users._id': userId }, { 'users.$.connection_status': 'connected' })
//   if (response && response.ok === 1) {
//     // push updates to client if updates were successful
//     socketIO.io.to(room).emit('match-user-connected', user); // return full user that just connected.
    
//     // check if we have everyone connected. if so, then push update to start game. Setting active_table_position to 1 should indicate
//     // to the client to start the game.
//     let updatedMatch = await currentMatch.getSingle({ '_id': matchId });
//     if (updatedMatch.users.length === updatedMatch.users.filter(x => x.connection_status === 'connected').length) {
    
//       let response = await currentMatch.update({ '_id': matchId }, { 'active_table_position': 1 });
//       if (response && response.ok === 1) {
//         socketIO.io.to(room).emit('active-table-position', 1); // return new active table position
//       }
//       else {
//         console.log('Failed to update active_table_position.');
//       }
//     }
//   }
//   else {
//     console.log('Failed to update user.');
//   }
// }