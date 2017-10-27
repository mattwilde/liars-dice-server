const express = require('express');
const router = new express.Router();

// Require Item model in our routes module
var MatchmakingQueuedUsers = require('../models/matchmaking-queued-users');

/**
 * gets full list of users in matchmaking queue
 */
router.get('/matchmaking_queued_users', (req, res) => {
  MatchmakingQueuedUsers.find(function (err, users){
    if(err){
      return res.status(500).json(err);
    }
    else {
      return res.status(200).json(users);
    }
  });
});

/**
 * gets single user in matchmaking queue
 */
router.get('/matchmaking_queued_users/:userId', (req, res) => {
  MatchmakingQueuedUsers.findOne({ 'user': req.params.userId }, function (err, user){
    if(err){
      return res.status(500).json(err);
    }
    else {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });  
      }
      else {
        return res.status(200).json(user);
      }
    }
  });
});

/**
 * adds a user to the matchmaking queue
 */
router.post('/matchmaking_queued_users', (req, res) => {
  const newQueueItem = new MatchmakingQueuedUsers({ 
    user: req.body.userId,
    mode: req.body.mode,
  });
  newQueueItem.save((err, queuedUser) => {
    if (err) { 
      return res.status(500).json(err);
    }

    return res.status(201).json({ message: 'Added user to the queue.' });
  });
});

/**
 * removes a user from the matchmaking queue
 */
router.delete('/matchmaking_queued_users/:userId', (req, res) => {
  MatchmakingQueuedUsers.deleteOne({ 'user': req.params.userId }, function (err){
    if(err){
      return res.status(500).json(err);
    }
    else {
      return res.status(200).json({ message: `User '${req.params.userId}' removed from queue` });  
    }
  });
});

module.exports = router;