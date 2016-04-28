var slack = require('../base.js');
var MongoStorage = require('../storage/mongo-storage.js')();

var botName = 'helloBot';

var helloCB = function(bot, message) {
    if (!slack.botAllowed(botName, message))
        return;
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });
    MongoStorage.user.findOne({'id': message.user}, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello.');
        }
    });
};

var nameCB = function(bot, message) {
    if (!slack.botAllowed(botName, message))
        return;
    var name = message.intents[0].entities.name[0].value;
     MongoStorage.user.findOne({'id': message.user}, function(err, user) {
        if (!user) {
            user = new MongoStorage.user();
            user.id = message.user;
        }
        user.name = name;
        MongoStorage.user.count({}, function(err, count) {
            if (err)
                return;
            if (count == 0) {
                user.isAdmin = true;
            }
            //the first user is an admin
            user.save(function(err, id) {
                bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
            });
        })
    });
};

var whoAmICB = function(bot, message) {
    if (!slack.botAllowed(botName, message))
        return;
    MongoStorage.user.findOne({'id': message.user}, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            MongoStorage.user.findOne({'id': message.user}, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                user.save(function(err, id) {
                                    if (!err)
                                        bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
};


exports.hello = {
    keywords: ['hello'],
    context: 'direct_message,direct_mention,mention',
    cb: helloCB,
    description: 'Says hello to anyone who says hello'
};
exports.name = {
    keywords: ['naming'],
    context: 'direct_message,direct_mention,mention',
    cb: nameCB,
    description: 'Type "call me <name>", and the bot will remember your name'
};
exports.whoAmI = {
    keywords: ['who_am_i'],
    context: 'direct_message,direct_mention,mention',
    cb: whoAmICB,
    description: 'Type "who am i", and the bot tell you what it thinks is your name'
};