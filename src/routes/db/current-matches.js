const express = require('express');
const router = new express.Router();

// Require Item model in our routes module
var CurrentMatches = require('../../models/current-matches');

/**
 * gets full list of current matches
 */
router.get('/', (req, res) => {
  CurrentMatches.find(function (err, users){
    if(err){
      return res.status(500).json(err);
    }
    else {
      return res.status(200).json(users);
    }
  });
});

/**
 * gets single current match
 */
router.get('/:matchId', (req, res) => {
  CurrentMatches.findOne({ '_id': req.params.matchId }, function (err, match){
    if(err){
      return res.status(500).json(err);
    }
    else {
      if (!match) {
        return res.status(404).json({ message: 'Match not found' });  
      }
      else {
        return res.status(200).json(match);
      }
    }
  });
});

/**
 * adds a current match match
 */
router.post('/', (req, res) => {
  const newMatch = new CurrentMatches({ 
    users: req.body.userIds,
    mode: req.body.mode,
  });
  newMatch.save((err, match) => {
    if (err) { 
      return res.status(500).json(err);
    }

    return res.status(201).json({ message: 'Match created.' });
  });
});

/**
 * removes a user from the matchmaking queue
 */
router.delete('/:matchId', (req, res) => {
  CurrentMatches.deleteOne({ '_id': req.params.matchId }, function (err){
    if(err){
      return res.status(500).json(err);
    }
    else {
      return res.status(200).json({ message: `Match '${req.params.matchId}' removed from current matches.` });  
    }
  });
});

module.exports = router;