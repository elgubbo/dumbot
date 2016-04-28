var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({
  id: String,
  teamId: String,
  name    : { type: String, required: false, trim: true },
  isAdmin:  {type: Boolean, default: false},
  created_at    : { type: Date, required: true, default: Date.now }
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;