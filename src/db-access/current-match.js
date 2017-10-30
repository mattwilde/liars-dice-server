var CurrentMatches = require('../models/current-matches');

/**
 * Creates a current match record with the mode and users passed in.
 * @param {object} -
 *    {String} mode - type of match. either casual or competetive
 *    {[String]} userIds - array of user IDs to insert into the match
 */
exports.create = async function({ mode, userIds }) {
  return new Promise( (resolve, reject) => {
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