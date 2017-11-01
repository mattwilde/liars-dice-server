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
      user = getUserByIdFromMatch(data.userId, match);
      let payload = { id: user._id, connectionStatus: 'connected'};
      socketIO.io.to(room).emit('match-user-connected', { _id: user._id, connection_status: 'connected'}); // return full user that just connected.
      console.log('SOCKET EMIT TO ROOM:', room, 'match-user-connected', payload);
      
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

  socket.on('player-action-pass', async data => {
    console.log('SOCKET RECEIVE:', 'player-action-pass', data);
    let match = await currentMatch.getSingle({ '_id': data.matchId });
    let user = getUserByIdFromMatch(data.userId, match);
    
    // arrange data in preparation for update
    let passAmount = match.min_bet;
    let updatePrevAction = { pass: true };
    let updateChipAmount = user.chip_amount - passAmount;
    let updatePot = match.pot + passAmount;
    let updateTablePosition = getNextTablePosition(match);
    
    // update record
    let response = await currentMatch.update({ '_id': data.matchId, 'users._id': data.userId }, { 
      'users.$.previous_action': updatePrevAction,
      'users.$.chip_amount': updateChipAmount,
      'pot': updatePot,
      'active_table_position': updateTablePosition,
    });
    if (response && response.ok === 1) { // on success
      // push update to clients
      let emitData = {
        _id: data.userId, 
        previous_action: updatePrevAction,
        chip_amount: updateChipAmount,
        pot: updatePot,
        active_table_position: updateTablePosition,
      };
      socketIO.io.to(`match ${data.matchId}`).emit('player-action-pass', emitData); // return new active table position
      console.log('SOCKET EMIT TO ROOM:', `match ${data.matchId}`, 'player-action-pass', emitData);
    }
    else {
      console.log('Failed to update match for player-action-pass event.');
    }
  });

  // socket.on('player-action-pass', async data => {
  //   console.log('SOCKET RECEIVE:', 'player-action-pass', data);

  //   // update record
  //   let response = await currentMatch.update({ '_id': data.matchId }, { 'pass': true });
  //   if (response && response.ok === 1) { // on success
  //     // push update to clients
  //     socketIO.io.to(`match ${data.matchId}`).emit('player-action-pass', { pass: true, activeTablePosition: 1); // return new active table position
  //     console.log('SOCKET EMIT TO ROOM:', `match ${data.matchId}`, 'player-action-pass', data.activeTablePosition);
  //   }
  //   else {
  //     console.log('Failed to update active_table_position.');
  //   }
  // });
}

function getUserByIdFromMatch(id, match) {
  console.log(match);
  let users = match.users.filter(x => x._id === id);
  if (users && users.length === 1) {
    return users[0];
  }

  return null;
}

function getCurrentPlayerIndex(users, activeTablePosition) {
  let activeUsers = users.filter(x => !isPreviousActionPass()); // get all users that haven't passed.
  let index = activeUsers.findIndex(x => x.table_position === activeTablePosition);
  if (index < 0) {
    console.log(`Failed to find current player index.`);
  }

  return index;  
}

function getNextTablePosition(match) {
  // let currentPosition = match.active_table_position;
  let totalPlayers = match.users.length;
  let users = match.users.filter(x => !isPreviousActionPass(x.previous_action)); // get all users that haven't passed.
  users = users.sort(compareTablePosition); // sort by table position. should already be in this order but need to make sure.

  let index = getCurrentPlayerIndex(users, match.active_table_position);
  let nextIndex = 0;
  if (index !== users.length - 1) { // if not last item in index, get next item
    nextIndex = index + 1;
  }

  return users[nextIndex].table_position;
}

function isPreviousActionPass(prevAction) {
  return prevAction
    && prevAction.hasOwnProperty('pass')
    && prevAction.pass === true;
}

function compareTablePosition(a,b) {
  if (a.table_position < b.table_position)
    return -1;
  if (a.table_position > b.table_position)
    return 1;
  return 0;
}
