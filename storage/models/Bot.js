var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var botSchema = new Schema({
  name    : { type: String, required: false, trim: true },
  path	: String,
  created_at    : { type: Date, required: true, default: Date.now }
});

// the schema is useless so far
// we need to create a model using it
var Bot = mongoose.model('Bot', botSchema);

// make this available to our users in our Node applications
module.exports = Bot;