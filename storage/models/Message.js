var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// this is not strict so i can save all kinds of messages
var messageSchema = new Schema({
  created_at    : { type: Date, required: true, default: Date.now }
}, {strict: false});

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;