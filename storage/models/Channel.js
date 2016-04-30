var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//TODO add specifics
var channelSchema = new Schema({
	id : String,
	disabledBots: Array,
	created_at    : { type: Date, required: true, default: Date.now },
});


channelSchema.statics.random = function(cb) {
  this.count(function(err, count) {
    if (err) {
        return cb(err);
    }
    var rand = Math.floor(Math.random() * count);
    this.findOne().skip(rand).exec(cb);
  }.bind(this));
};

var Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;