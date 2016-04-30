var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var botSchema = new Schema({
  name    : { type: String, required: false, trim: true },
  path	: String,
  created_at    : { type: Date, required: true, default: Date.now }
});

var Bot = mongoose.model('Bot', botSchema);
module.exports = Bot;