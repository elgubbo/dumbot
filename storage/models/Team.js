var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//TODO add specifics
var teamSchema = new Schema({
	created_at    : { type: Date, required: true, default: Date.now },
	slackTeam : {},
	disabledBots: {},
});

var Team = mongoose.model('Team', teamSchema);

module.exports = Team;