var MatchmakingQueuedUsers = require('../models/matchmaking-queued-users');
var CurrentMatches = require('../models/current-matches');
var socket = require('../socket/socket');

// data access
var matchmakingQueuedUsers = require('../db-access/matchmaking-queued-users');
var currentMatch = require('../db-access/current-match');

// Module functions

/**
 * This function is called whenever a user is added to the matchmaking queue.  It will determine whether a
 * match can be created
 */
exports.onQueueUpdated = async function() {
  console.log('The queue was updated');
  let queuedItemsCasualCount = await matchmakingQueuedUsers.getCount({ mode: 'casual' });
  let queuedItemsCompetetiveCount = await matchmakingQueuedUsers.getCount({ mode: 'competetive' });

  console.log('CASUAL COUNT:', queuedItemsCasualCount);
  console.log('COMPETETIVE COUNT:', queuedItemsCompetetiveCount);

  // create match if users are at least 2
  if (queuedItemsCasualCount >= 2) { // handle users looking for a casual match
    await initializeMatch({ userCount: 2, mode: 'casual' });
  }
  
  if (queuedItemsCompetetiveCount >= 2) { // handle users looking for a competitive match
    await initializeMatch({ userCount: 2, mode: 'competetive' });
  }
}

/**
 * This function will create an initialized match where none of the participating players will be connected
 * to start.
 * @param {object} param0 
 */
async function initializeMatch({ userCount = 2, mode = 'casual' }) {
  console.log('INIT MATCH', userCount, mode);
  let queuedItems = await matchmakingQueuedUsers.get({ mode });
  let matchUsers = queuedItems.slice(0, userCount).map(x => x.user);
  
  let match = await currentMatch.create({
    userIds: matchUsers,
    mode,
  });

  socket.io.to('matchmaking').emit('found-match', match); // emits only to members of 'matchmaking room'
}