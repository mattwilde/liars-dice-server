/**
 * This module contains all of the match related socket events and listeners.
 */
const jwt = require('jsonwebtoken');
const socketIO = require('./socket');
const currentMatch = require('../db-access/current-match');
const matchApp = require('../app/match');

var Chance = require('chance'),
chance = new Chance();

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
    console.log(`User '${data.userId}' joined room '${room}'`);

    // decode the token to get user and then add them to a user-specific room.
    jwt.verify(socket.handshake.query.token, process.env.LIARS_DICE_JWT_SECRET, (err, decoded) => {
      if (err) { 
        socket.disconnect('unauthorized');
        return; 
      }

      const userId = decoded.sub;
      socket.join(`match ${data.matchId} ${userId}`);
      console.log(`User '${userId}' joined room 'match ${data.matchId} ${userId}'`);
    });

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

  socket.on('player-action-pass', async (data, errCb) => {
    console.log('SOCKET RECEIVE:', 'player-action-pass', data);
    let match = await currentMatch.getSingle({ '_id': data.matchId });
    let user = getUserByIdFromMatch(data.userId, match);
    
    // arrange data in preparation for update
    let passAmount = match.min_bet;
    let updatePrevAction = { pass: true };
    let updateChipAmount = user.chip_amount - passAmount;
    let updatePot = match.pot + passAmount;
    let updateTablePosition = getNextTablePosition(match);

    // If we don't have a next table position, that means we are down to the last player. The last player cannot pass. 
    if (updateTablePosition === -1) {
      errCb('Cannot pass on your last turn, dude');
    }
    
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

  socket.on('player-action-bid', async (data, errCb) => {
    console.log('SOCKET RECEIVE:', 'player-action-bid', data);
    let match = await currentMatch.getSingle({ '_id': data.matchId });

    // validate bid
    if (!matchApp.isBidValid(match, data.bid)) {
      errCb('Illegal bid.');
      return;
    }
  
    // arrange data in preparation for update
    let updatePrevAction = { bid: data.bid };
    let updateTablePosition = getNextTablePosition(match);
    
    // If we don't have a next table position, that means we are down to the last player. The last player cannot pass. 
    if (updateTablePosition === -1) {
      errCb('Cannot bid if there are no other players still in.');
    }
    
    // update record
    let response = await currentMatch.update({ '_id': data.matchId, 'users._id': data.userId }, { 
      'users.$.previous_action': updatePrevAction,
      'active_table_position': updateTablePosition,
    });
    if (response && response.ok === 1) { // on success
      // push update to clients
      let emitData = {
        _id: data.userId, 
        previous_action: updatePrevAction,
        active_table_position: updateTablePosition,
      };
      socketIO.io.to(`match ${data.matchId}`).emit('player-action-bid', emitData); // return new active table position
      console.log('SOCKET EMIT TO ROOM:', `match ${data.matchId}`, 'player-action-bid', emitData);
    }
    else {
      console.log('Failed to update match for player-action-bid event.');
    }
  });

  socket.on('player-action-bid-and-reroll', async (data, errCb) => {
    console.log('SOCKET RECEIVE:', 'player-action-bid-and-reroll', data);
    let match = await currentMatch.getSingle({ '_id': data.matchId });
    let user = getUserByIdFromMatch(data.userId, match);
   
    // validate bid
    if (!matchApp.isBidValid(match, data.bid)) {
      errCb('Illegal bid.');
      return;
    }
  
    // arrange data in preparation for update
    let diceToReroll = user.dice.filter(x => !x.lost && x.hidden); // filter out non-hidden or lost dice
    data.diceShown.map(x => {
      diceToReroll = diceToReroll.filter(d => d._id !== x); // filter out dice we will show.
    });

    let updatePrevAction = { 
      bid: data.bid,
      reroll: {
        dice_held: data.diceShown,
        rolled_dice: diceToReroll.map(x => { return {
          _id: x._id,
          face: x.face
        }})
      }
    };
    let updateTablePosition = getNextTablePosition(match);
    let diceIndexes = [];
    data.diceShown.map(d => {
      let idx = user.dice.findIndex(x => x._id === d);
      diceIndexes.push(idx);
      user.dice[idx].hidden = false;
    });
    
    let rerollDiceIndexes = [];
    updatePrevAction.reroll.rolled_dice.map(d => {
      let idx = user.dice.findIndex(x => x._id === d._id);
      rerollDiceIndexes.push(idx);
      user.dice[idx].face = chance.d6();
    });
    
    let updateUserDice = user.dice;
        
    // If we don't have a next table position, that means we are down to the last player. The last player cannot pass. 
    if (updateTablePosition === -1) {
      errCb('Cannot bid if there are no other players still in.');
    }
    
    let updateBody = { 
      'users.$.previous_action': updatePrevAction,
      'active_table_position': updateTablePosition,
    };
    
    diceIndexes.map(x => {
      updateBody[`users.$.dice.${x}.hidden`] = updateUserDice[x].hidden;
    });

    rerollDiceIndexes.map(x => {
      updateBody[`users.$.dice.${x}.face`] = updateUserDice[x].face;
    });
    console.log(updateBody);

    // update record
    let response = await currentMatch.update({ '_id': data.matchId, 'users._id': data.userId }, updateBody);
    if (response && response.ok === 1) { // on success
      // push update to clients
      let emitData = {
        _id: data.userId, 
        dice: updateUserDice,
        previous_action: updatePrevAction,
        active_table_position: updateTablePosition,
      };
      socketIO.io.to(`match ${data.matchId}`).emit('player-action-bid-and-reroll', emitData); // return new active table position
      console.log('SOCKET EMIT TO ROOM:', `match ${data.matchId}`, 'player-action-bid-and-reroll', emitData);
    }
    else {
      console.log('Failed to update match for player-action-bid-and-reroll event.');
    }
  });

  socket.on('player-action-challenge-bet', async (data, errCb) => {
    console.log('SOCKET RECEIVE:', 'player-challenge-bet', data);
    let match = await currentMatch.getSingle({ '_id': data.matchId });

    // validate challenge bet
    if (!matchApp.isChallengeBetValid(match, data.bet)) {
      errCb('Illegal challenge bet.');
      return;
    }

    // arrange data in preparation for update
    let updatePrevAction = { challenge: {
      action: 'bet',
      delta_bet: data.bet,
      aggregate_bet: data.bet,
     }};
    let updateTablePosition = getPrevTablePosition(match); // set position back to bettor
    let updateBettingCount = 1;
    let updatePot = match.pot + data.bet;
    
    // If we don't have a next table position, that means we are down to the last player. The last player cannot pass. 
    if (updateTablePosition === -1) {
      errCb('Cannot challenge if there are no other players still in.');
    }
    
    // update record
    let response = await currentMatch.update({ '_id': data.matchId, 'users._id': data.userId }, { 
      'users.$.previous_action': updatePrevAction,
      'active_table_position': updateTablePosition,
    });
    if (response && response.ok === 1) { // on success
      // push update to clients
      let emitData = {
        _id: data.userId, 
        previous_action: updatePrevAction,
        active_table_position: updateTablePosition,
        betting_count: updateBettingCount,
        pot: updatePot,
      };
      socketIO.io.to(`match ${data.matchId}`).emit('player-action-challenge-bet', emitData); // return new active table position
      console.log('SOCKET EMIT TO ROOM:', `match ${data.matchId}`, 'player-action-challenge-bet', emitData);
    }
    else {
      console.log('Failed to update match for player-action-challenge-bet event.');
    }
  });

  socket.on('player-action-challenge-call', async (data, errCb) => {
    console.log('SOCKET RECEIVE:', 'player-challenge-call', data);
    let match = await currentMatch.getSingle({ '_id': data.matchId });

//TODO: maw - will need to look at last challenger and validate that the player had either bet or raised.

    // validate challenge call
    // if (!matchApp.isChallengeCallValid(match)) {
    //   errCb('Illegal challenge call.');
    //   return;
    // }
    
//TODO: maw - need to cycle through previous players until we find the previous challenge.  Then we need to look at their aggregate bet and try to match.
              //calculate what the delta needs to be to match current bet. if player funds are too low, then put in rest of money as all in. only put the matched
              //money into the pot at this point. extras go back to player that had him covered.
    // arrange data in preparation for update
    // let updatePrevAction = { challenge: {
    //   action: 'call',
    //   delta_bet: data.bet,
    //   aggregate_bet: data.bet,
    //  }};
    let updateTablePosition = -1; // calling a challenge marks the end of the round.
    // let updateBettingCount = 1;
    // let updatePot = match.pot + data.bet;
    
    // If we don't have a next table position, that means we are down to the last player. The last player cannot pass. 
    if (updateTablePosition === -1) {
      errCb('Cannot challenge if there are no other players still in.');
    }
    
    // update record
    let response = await currentMatch.update({ '_id': data.matchId, 'users._id': data.userId }, { 
//TODO: maw - resolve cash and dice here based on challenge. probably also need to store winner of challenge in the database.
      'users.$.previous_action': updatePrevAction,
      'active_table_position': updateTablePosition,
    });
    if (response && response.ok === 1) { // on success
      // push update to clients
      let emitData = {
        _id: data.userId, 
        previous_action: updatePrevAction,
        active_table_position: updateTablePosition,
        // betting_count: updateBettingCount,
        // pot: updatePot,
      };
      socketIO.io.to(`match ${data.matchId}`).emit('player-action-challenge-call', emitData); // return new active table position
      console.log('SOCKET EMIT TO ROOM:', `match ${data.matchId}`, 'player-action-challenge-call', emitData);
    }
    else {
      console.log('Failed to update match for player-action-challenge-call event.');
    }
  });
  
}

function getUserByIdFromMatch(id, match) {
  let users = match.users.filter(x => x._id === id);
  if (users && users.length === 1) {
    return users[0];
  }

  return null;
}

function getCurrentPlayerIndex(users, activeTablePosition) {
  // let activeUsers = users.filter(x => !isPreviousActionPass()); // get all users that haven't passed.
  let index = users.findIndex(x => x.table_position === activeTablePosition);
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
  if (users.length === 1) { // handle if last user
    return -1;
  }
  
  return users[nextIndex].table_position;
}

function getPrevTablePosition(match) {
  // let currentPosition = match.active_table_position;
  let totalPlayers = match.users.length;
  let users = match.users.filter(x => !isPreviousActionPass(x.previous_action)); // get all users that haven't passed.
  users = users.sort(compareTablePosition); // sort by table position. should already be in this order but need to make sure.

  let index = getCurrentPlayerIndex(users, match.active_table_position);
  let prevIndex = users.length - 1;
  if (index !== 0) { // if not first item in index, get prev item
    prevIndex = index - 1;
  }
  if (users.length === 1) { // handle if last user
    return -1;
  }
  
  return users[prevIndex].table_position;
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
