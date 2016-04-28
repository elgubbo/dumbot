var mongoose = require('mongoose');
var User = require('./models/User.js');
var Team = require('./models/Team.js');
var Bot = require('./models/Bot.js');
var Channel = require('./models/Channel.js');

module.exports = function() {

    var storage = {
        team: Team,
        user: User,
        channel: Channel,
        bot: Bot,
    };

    return storage;
};