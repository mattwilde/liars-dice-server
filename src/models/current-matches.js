const mongoose = require('mongoose');

// define the CurrentMatches model schema
const CurrentMatchesSchema = new mongoose.Schema({
  // _id: { type: mongoose.Schema.Types.ObjectId, index:true, unique: true },
  users: { type: [String] }, // changing to string so we dont have weird casting errors...
  mode: String,
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