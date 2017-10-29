var MatchmakingQueuedUsers = require('../models/matchmaking-queued-users');
var CurrentMatches = require('../models/current-matches');
var app = require('../../app'); // required to have access to sockets.

exports.onQueueUpdated = async function() {
  console.log('The queue was updated');
  let queuedItemsCasualCount = await getMatchmakingQueuedUsersCount({ mode: 'casual' });
  let queuedItemsCompetetiveCount = await getMatchmakingQueuedUsersCount({ mode: 'competetive' });

console.log('CASUAL COUNT:', queuedItemsCasualCount);
console.log('COMPETETIVE COUNT:', queuedItemsCompetetiveCount);

  // create match if users are at least 2
  if (queuedItemsCasualCount >= 2) {
    console.log('casual IN');
    await initializeMatch({ userCount: 2, mode: 'casual' });
  }
  
  if (queuedItemsCompetetiveCount >= 2) {
    console.log('competetive IN');
    
    await initializeMatch({ userCount: 2, mode: 'competetive' });
  }
}

async function initializeMatch({ userCount = 2, mode = 'casual' }) {
  console.log('INIT MATCH', userCount, mode);
  let queuedItems = await getMatchmakingQueuedUsers({ mode });
  console.log(queuedItems);
  let matchUsers = queuedItems.slice(0, userCount).map(x => x.user);
  console.log(matchUsers);
  
  let match = await createCurrentMatch({
    userIds: matchUsers,
    mode,
  });

  app.get('io').to('matchmaking').emit('found-match', match); // emits only to members of 'matchmaking room'
}

/**
 * Gets the list of matchmaking queued users matching query.
 * @param {object} query - fields to query on.
 */
async function getMatchmakingQueuedUsers(query) {
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
async function getMatchmakingQueuedUsersCount(query) {
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

async function createCurrentMatch({ mode, userIds }) {
  return new Promise( (resolve, reject) => {
    console.log('CREATE', userIds);
    try {
      let newMatch = new CurrentMatches({ 
        users: userIds.map(x => { return { 
          '_id': x, 
          'connection_status': 'not connected',
        }}),
        mode: mode,
      });
      newMatch.save((err, match) => {
        if (err) {
          return reject(err);
        }
        else {
          return resolve(match);
        }
      });
    }
    catch (e) {
      console.log(e);
      return reject(e);
    }
  });
}

// async function pushMatchCreated(matchId) {
//   fetch(`${process.env.LIARS_DICE_WEB_URL}/webhooks/match_created/${matchId}`, {
//     headers: {
//       'Accept': 'application/json',
//       'Content-Type': 'application/json'
//     },
//     method: "POST",
//     body: JSON.stringify({
//       test: 1,
//       // userId: this.state.user._id,
//       // mode: this.state.modeValue,
//     }),
//   })
//     .then(res => {
//       res.json().then(body => { // failure
//         if (res.status === 201) { // success
//           console.log('Testing match push');
//           // this.setState({ isFindingMatch: true });
//         }
//         else {
//           // if (body.code === 11000) { // if user already in queue...
//           //   console.log('User already in queue');
//           // }
//           // else {
//           //   console.log(`Unexpected error: ${body.errmsg}`);
//           // }
//           console.log('failed push test.');
//         }
//       });
//     })
//     .catch(res => console.log('fail',res));
// };