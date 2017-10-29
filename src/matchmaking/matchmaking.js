var MatchmakingQueuedUsers = require('../models/matchmaking-queued-users');
var CurrentMatches = require('../models/current-matches');
var app = require('../../app'); // required to have access to socket.

exports.onQueueUpdated = async function() {
  console.log('The queue was updated');
  let users = await getMatchmakingQueuedUsers();

  console.log(users);
  // create match if users are at least 2
  //TODO: check for at least 2 in competetive and casual modes separately.
  if (users.length >= 2) {

    let matchUsers = [users[0]._id, users[1]._id];

    let match = await createCurrentMatch({
      userIds: matchUsers,
      mode: users[0].mode, //TODO: still need to deal with the different modes.
    });
    console.log(match);
    app.get('socket').emit('found-match', match);
    // console.log('TODO: Create match and send update to webhook so users can be redirected to match.');
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
      return reject(e);
    }
  });
}

async function createCurrentMatch({ mode, userIds }) {
  return new Promise( (resolve, reject) => {
    try {
      let newMatch = new CurrentMatches({ 
        users: userIds,
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

async function pushMatchCreated(matchId) {
  fetch(`${process.env.LIARS_DICE_WEB_URL}/webhooks/match_created/${matchId}`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: "POST",
    body: JSON.stringify({
      test: 1,
      // userId: this.state.user._id,
      // mode: this.state.modeValue,
    }),
  })
    .then(res => {
      res.json().then(body => { // failure
        if (res.status === 201) { // success
          console.log('Testing match push');
          // this.setState({ isFindingMatch: true });
        }
        else {
          // if (body.code === 11000) { // if user already in queue...
          //   console.log('User already in queue');
          // }
          // else {
          //   console.log(`Unexpected error: ${body.errmsg}`);
          // }
          console.log('failed push test.');
        }
      });
    })
    .catch(res => console.log('fail',res));
};