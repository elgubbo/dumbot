var User = require('./models/User.js');
var Team = require('./models/Team.js');
var Bot = require('./models/Bot.js');
var Channel = require('./models/Channel.js');
var Message = require('./models/Message.js');

module.exports = function() {

    var storage = {
        team: Team,
        user: User,
        channel: Channel,
        bot: Bot,
        message: Message
    };

    return storage;
};