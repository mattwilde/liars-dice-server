var socket = require('../socket/socket');

// data access
var matchmakingQueuedUsers = require('../db-access/matchmaking-queued-users');
var currentMatch = require('../db-access/current-match');

var Chance = require('chance'),
chance = new Chance();

/**
 * This function will create an initialized match where none of the participating players will be connected
 * to start.
 * @param {object} param0 
 */
exports.createNewMatch = async function({ userCount = 6, mode = 'casual', diceCount = 5, minBet = 5, maxBet = 10, chipAmount = 125 }) {
  console.log('INIT MATCH', userCount, mode);
  let queuedItems = await matchmakingQueuedUsers.get({ mode });
  let matchUsers = queuedItems.slice(0, userCount).map(x => x.user);
  
  let match = await currentMatch.create({
    users: matchUsers.map((x, index) => {
      return {
        '_id': x, 
        'connection_status': 'not connected',
        'table_position': index + 1,
        'chip_amount': chipAmount - (minBet * diceCount),
        'dice': createDiceArray(5),
        'previous_action': null,
      }
    }),
    'mode': mode,
    'min_bet': minBet,
    'max_bet': maxBet,
    'max_buy_in': minBet * 25,
    'dice_chip_pool': minBet * diceCount * userCount,
    'active_table_position': -1,
    'pot': 0,
  });

  socket.io.to('matchmaking').emit('found-match', match); // emits only to members of 'matchmaking room'
}

exports.isBidValid = function(match, bid) {
  let totalDice = getTotalDice(match);
  let bidIndex = getBidArray(totalDice).findIndex(x => x.count === bid.count && x.face === bid.face);
  if (bidIndex < 0) {
    return false;
  }

  //TODO: probably validate against the previous bid.  i assume this will be restricted on client side but want to check it here also.  perhaps client will send message and server will respond with error if bid is illegal. (maw)
  // let prevBid = this.getPrevPlayerBid(match);
  // if (!prevBid) {
  //   return true;
  // }

  // let prevBidIndex = this.getBidArray(totalDice).findIndex(x => x.count === prevBid.count && x.face === prevBid.face);
  
  // // if previous bid is bigger or equal to the one proposed then the bid is not legal.
  // if (prevBidIndex >= bidIndex) {
  //   return false;
  // }

  return true;
}

/**
 * Creates an array of random dice for use in current-match
 * @param {number} amount - number of dice in array to create
 */
function createDiceArray(amount)
{
    var result = [];
    for (var i = 0; i < amount; i++) {
      result.push({
        '_id': chance.guid(),
        'face': chance.d6(),
        'hidden': true,
        'lost': false,
      });
    }
    return result;
}

function getBidArray(totalDice) {
  let bids = [];
  
    for (let count = 1; count <= totalDice; count++) {
      for (let i = 2; i <= 6; i++) {
        bids.push({count: count, face: i});
      }
      if (count % 2) {
        bids.push({count: (count + 1) / 2, face: 1});
      }
    }
      
    // add star bets 16-30
    for (let count = Math.floor(totalDice / 2) + 1; count <= totalDice; count++) {
      bids.push({count: count, face: 1});
    }
  
    return bids;
}



function getTotalDice(match) {
  let diceCount = match.users.map(x => x.dice.filter(d => !d.lost).length) // gets all dice not lost
    .reduce((sum, val) => { // adds dice for all users together.
      return sum + val; 
    });

  return diceCount;
}