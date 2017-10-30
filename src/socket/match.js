/**
 * This module contains all of the match related socket events and listeners.
 */

const socketIO = require('./socket');
const currentMatch = require('../db-access/current-match');

exports.setEvents = async function (socket) {
  /**
   * join-match - This event is sent when a client is attempting to join a match.  User connection status will be updated
   *              in the current-match record
   * data: {
   *  matchId - ID of the match to join
   *  userId - ID of the user that is joining
   * }
   */
  socket.on('join-match', async data => {
    console.log('SOCKET RECEIVE:', 'join-match', data.matchId);

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

    // update record
    let response = await currentMatch.update({ '_id': data.matchId, 'users._id': data.userId }, { 'users.$.connection_status': 'connected' })
    if (response && response.ok === 1) { // on success
      // push update to clients
      let updatedMatch = await currentMatch.getSingle({ '_id': data.matchId });
      users = updatedMatch.users.filter(x => x._id === data.userId);
      if (users && users.length === 1) {
        user = users[0];
      }
        
      socketIO.io.to(room).emit('match-user-connected', user); // return full user that just connected.
      console.log('SOCKET EMIT TO ROOM:', room, 'match-user-connected', user);
      
      // check if we have everyone connected. if so, then push update to start game. Setting active_table_position to 1 should indicate
      // to the client to start the game.
      if (updatedMatch.users.length === updatedMatch.users.filter(x => x.connection_status === 'connected').length) {
        let response = await currentMatch.update({ '_id': data.matchId }, { 'active_table_position': 1 });
        if (response && response.ok === 1) { // on success
          // push updates to clients
          socketIO.io.to(room).emit('active-table-position', 1);
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

  /**
   * active-table-position -  This event is sent when a client updates their local active table position.  In other words,
   *                          when it is the next player's turn.  The listener here will push that update to the rest of the
   *                          clients.
   * data: {
   *  matchId - ID of the match to join
   *  userId - ID of the user that is joining
   * }
   */
  socket.on('active-table-position', async data => {
    console.log('SOCKET RECEIVE:', 'active-table-position', data);

    // update record
    let response = await currentMatch.update({ '_id': data.matchId }, { 'active_table_position': data.activeTablePosition });
    if (response && response.ok === 1) { // on success
      // push update to clients
      socketIO.io.to(`match ${data.matchId}`).emit('active-table-position', data.activeTablePosition); // return new active table position
      console.log('SOCKET EMIT TO ROOM:', `match ${data.matchId}`, 'active-table-position', data.activeTablePosition);
    }
    else {
      console.log('Failed to update active_table_position.');
    }
  });
}