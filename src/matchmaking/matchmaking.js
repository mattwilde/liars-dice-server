var MatchmakingQueuedUsers = require('../models/matchmaking-queued-users');
var CurrentMatches = require('../models/current-matches');

exports.onQueueUpdated = async function() {
  console.log('The queue was updated');
  let users = await getMatchmakingQueuedUsers();

  // create match if users are at least 2
  //TODO: check for at least 2 in competetive and casual modes separately.
  if (users.length >= 2) {
    console.log('TODO: Create match and send update to webhook so users can be redirected to match.');
    //TODO: then remove users from matchmaking queue...
  }
}

async function getMatchmakingQueuedUsers() {
  return new Promise( (resolve, reject) => {
    try {
      MatchmakingQueuedUsers.find(function (err, users){
        if(err){
          return reject(err);
        }
        else {
          return resolve(users);
        }
      });
    }
    catch (e) {
      console.log(e);
    }
  });
}