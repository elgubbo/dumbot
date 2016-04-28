var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//TODO add specifics
var channelSchema = new Schema({
	id : String,
	disabledBots: Array,
	created_at    : { type: Date, required: true, default: Date.now },
});

var Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;