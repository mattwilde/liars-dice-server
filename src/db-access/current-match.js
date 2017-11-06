var CurrentMatches = require('../models/current-matches');

/**
 * Creates a current match record with the mode and users passed in.
 * @param {object} -
 *    {String} mode - type of match. either casual or competetive
 *    {[String]} userIds - array of user IDs to insert into the match
 */
exports.create = async function({ users, mode, min_bet, max_bet, max_buy_in, dice_chip_pool, active_table_position, pot, betting_cap, betting_count }) {
  return new Promise( (resolve, reject) => {
    try {
      let newMatch = new CurrentMatches({ 
        'users': users,
        'mode': mode,
        'min_bet': min_bet,
        'max_bet': max_bet,
        'max_buy_in': max_buy_in,
        'dice_chip_pool': dice_chip_pool,
        'active_table_position': active_table_position,
        'pot': pot,
        'betting_cap': betting_cap,
        'betting_count': betting_count,
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

/**
 * Gets the list of current matches matching query.
 * @param {object} query - fields to query on.
 */
exports.get = async function(query) {
  return new Promise( (resolve, reject) => {
    try {
      CurrentMatches.find(query, function (err, matches){
        if(err){
          return reject(err);
        }
        else {
          return resolve(matches);
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
 * Gets a single current match matching query.
 * @param {object} query - fields to query on.
 */
exports.getSingle = async function(query) {
  return new Promise( (resolve, reject) => {
    try {
      CurrentMatches.findOne(query, function (err, match){
        if(err){
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

/**
 * Gets the list of current matches matching query.
 * @param {object} query - fields to query on.
 */
exports.update = async function(query, updateSet) {
  return new Promise( (resolve, reject) => {
    try {
      CurrentMatches.update(query, { $set: updateSet }, function (err, match){
        if(err){
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