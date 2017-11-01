var MatchmakingQueuedUsers = require('../models/matchmaking-queued-users');
var CurrentMatches = require('../models/current-matches');
var match = require('./match');
var socket = require('../socket/socket');

// data access
var matchmakingQueuedUsers = require('../db-access/matchmaking-queued-users');
var currentMatch = require('../db-access/current-match');


// Module functions

/**
 * This function is called whenever a user is added to the matchmaking queue.  It will determine whether a
 * match can be created
 */
exports.processQueue = async function() {
  console.log('The queue was updated');
  let queuedItemsCasualCount = await matchmakingQueuedUsers.getCount({ mode: 'casual' });
  let queuedItemsCompetetiveCount = await matchmakingQueuedUsers.getCount({ mode: 'competetive' });

  console.log('CASUAL COUNT:', queuedItemsCasualCount);
  console.log('COMPETETIVE COUNT:', queuedItemsCompetetiveCount);

  // create match if users are at least 2
  if (queuedItemsCasualCount >= 2) { // handle users looking for a casual match
    await match.createNewMatch({ userCount: 2, mode: 'casual' });
  }
  
  if (queuedItemsCompetetiveCount >= 2) { // handle users looking for a competitive match
    await match.createNewMatch({ userCount: 2, mode: 'competetive'});
  }
}
