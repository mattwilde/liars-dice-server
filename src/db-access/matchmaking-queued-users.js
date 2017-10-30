var MatchmakingQueuedUsers = require('../models/matchmaking-queued-users');

/**
 * Gets the list of matchmaking queued users matching query.
 * @param {object} query - fields to query on.
 */
exports.get = async function(query) {
  return new Promise( (resolve, reject) => {
    try {
      MatchmakingQueuedUsers.find(query, function (err, queuedItems){
        if(err){
          return reject(err);
        }
        else {
          return resolve(queuedItems);
        }
      });
    }
    catch (e) {
      console.log(e);
      return reject(e);
    }
  });
}


/**
 * Gets the count of matchmaking queued users matching query.
 * @param {object} query - fields to query on.
 */
exports.getCount = async function(query) {
  return new Promise( (resolve, reject) => {
    try {
      MatchmakingQueuedUsers.count(query, function (err, count){
        if(err){
          return reject(err);
        }
        else {
          return resolve(count);
        }
      });
    }
    catch (e) {
      console.log(e);
      return reject(e);
    }
  });
}