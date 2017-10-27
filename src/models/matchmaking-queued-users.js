const mongoose = require('mongoose');

// define the MatchmakingQueuedUsers model schema
const MatchmakingQueuedUsersSchema = new mongoose.Schema({
  // user: { type: mongoose.Schema.Types.ObjectId, index:true, unique: true },
  user: { type: String, index:true, unique: true }, // changing to string so we dont have weird casting errors...
  mode: String,
  created_at    : { type: Date },
  updated_at    : { type: Date },
});

MatchmakingQueuedUsersSchema.pre('save', function(next){
  now = new Date();
  this.updated_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});

module.exports = mongoose.model('matchmaking-queued-users', MatchmakingQueuedUsersSchema);