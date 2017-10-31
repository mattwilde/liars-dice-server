const mongoose = require('mongoose');

// define the CurrentMatches model schema
const CurrentMatchesSchema = new mongoose.Schema({
  // _id: { type: mongoose.Schema.Types.ObjectId, index:true, unique: true },
  users: { type: [mongoose.Schema.Types.Mixed] },
  //  [{
  //    _id: <user id>
  //    connection_status: <status> enum['connected', 'not connected']
  //    table_position: [1-6]
  //    chip_amount:
  //    dice: [{
  //      _id: <dice id>
  //      face: [1 (star), 2, 3, 4, 5, 6],
  //      hidden: false
  //      lost: false
  //    }]
  //    previous_action: {
  //      bid: {
  //        value:
  //        count:
  //      },
  //      reroll: {
  //        dice_held: [ dice ids... ]
  //        rolled_dice: [{
  //          _id: -> what die was rolled
  //          value: -> what its new value is
  //        }]
  //      },
  //      pass: false,
  //      challenge: {
  //        action: [bet, call, or raise]
  //        delta_chip_amount:
  //        aggregate_chip_amount:
  //      } 
  //    }
  //  }, ...]
  mode: String,
  min_bet: Number, // 5
  max_bet: Number, // 10
  max_buy_in: Number, // 125 (25xmB)
  active_table_position: Number,
  created_at    : { type: Date },
  updated_at    : { type: Date },
});

CurrentMatchesSchema.pre('save', function(next){
  now = new Date();
  this.updated_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});

/**
 * The pre-save hook method.
 */
CurrentMatchesSchema.pre('save', function saveHook(next) {
  // const matchmaking = require('../matchmaking/matchmaking.js');
  // matchmaking.onQueueUpdated();
  return next();
});

module.exports = mongoose.model('current-matches', CurrentMatchesSchema);