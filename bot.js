var slack = require('./base.js');
var config = require('./config_prod.js');
var cluster = require('cluster');
var MongoStorage = require('./storage/mongo-storage.js')();
var wit = require('botkit-middleware-witai')({
    token: config.apiKeys.wit
});

//this automatically restarts the process if one worker is killed (eg due to unloading of bots)
if (cluster.isMaster) {
   cluster.fork();
   //if the worker dies, restart it.
   cluster.on('exit', function(worker){
      console.log('Worker ' + worker.id + ' died..');
      cluster.fork();
   });
}
//this is the actual worker process
else{
    var botLoadCB = function(bot, message) {
        var name = message.match[1];
        if (!message.fromAdmin) {
            bot.reply(message, 'You cannot load a bot, you are not an admin!');
            return;
        } else {
            MongoStorage.bot.findOne({'name': name}, function(err, subBot) {
                if (!subBot) {
                    bot.reply(message, 'Cannot find the bot you want to load!');
                } else {
                    MongoStorage.channel.findOne({'id': message.channel}, function(err, channel) {
                        if (!channel) {
                            channel = new MongoStorage.channel();
                            channel.id = message.channel;
                        } else {
                            if (channel.disabledBots && channel.disabledBots.indexOf(subBot.name) > -1) {
                                channel.disabledBots.splice(channel.disabledBots.indexOf(subBot.name));
                            }
                        }
                        channel.save(function(err, res) {
                            if(res) {
                                bot.reply(message, 'Okay! Enabled ' + subBot.name + 'for this channel');
                            }
                        });
                    });
                }
            });
        }
    };

    var botUnLoadCB = function(bot, message) {
        var name = message.match[1];
        if (!message.fromAdmin) {
            bot.reply(message, 'You cannot unload a bot, you are not an admin!');
            return;
        } else {
            MongoStorage.bot.findOne({'name': name}, function(err, subBot) {
                if (!subBot) {
                    bot.reply(message, 'Cannot find the bot you want to unload!');
                } else {
                    MongoStorage.channel.findOne({'id': message.channel}, function(err, channel) {
                        if (!channel) {
                            channel = new MongoStorage.channel();
                            channel.id = message.channel;
                            channel.disabledBots = [subBot.name];
                        } else {
                            if (channel.disabledBots){
                                channel.disabledBots.push(subBot.name);
                            } else {
                                channel.disabledBots = [subBot.name];
                            }
                        }
                        channel.save(function(err, res) {
                            if(res) {
                                bot.reply(message, 'Okay! Disabled ' + subBot.name + 'for this channel');
                            }
                        });
                    });
                }
            });
        }
    };

    var listAllBots = function(bot, message) {
        MongoStorage.bot.find({}, function(err, botList) {
            if (err) {
                slack.controler.debug(err);
                return;
            }

            var reply = {
                'text': "This is a List of all the bots available \n If you need more information on what functions a bot has, type '<botname> help'",
                'attachments': [
                ],
            };

            var attachments = botList.map(function(item) {
                return {
                    'title': item.name,
                    'color': "#36a64f",
                };
            });
            reply.attachments = attachments;
            bot.reply(message, reply);

        }.bind(this));
    };

    var botHelpCB = function(bot, message) {
        var name = message.match[1];
        MongoStorage.bot.findOne({'name': name}, function(err, subBot) {
            if (!err && subBot) {
                var currentBot = require(subBot.path);
                var attachments = [];
                var reply = {
                    'text': "Here is a Description for " + subBot.name + " and its features",
                    'attachments': [
                    ],
                };
                for (var action in currentBot) {
                    if (currentBot.hasOwnProperty(action)) {
                        attachments.push({
                            'title': action,
                            'text': "Keywords: "+currentBot[action].keywords+'\n Description: '+currentBot[action].description,
                            'color': "#36a64f",
                        });
                    }
                }
                reply.attachments = attachments;
                bot.reply(message, reply);
            } else {
                bot.reply(message, "Sorry i don't know this bot");
            }
        });
    };

    var addAdminCB = function(bot, message) {
        if (!message.fromAdmin) {
            bot.reply(message, 'You cannot make someone admin, because you are not an admin yourself!');
            return;
        }
        var name = message.match[1];
        MongoStorage.user.findOne({'name': name}, function(err, res) {
            if (!res) {
                bot.reply(message, 'Cannot find the user!');
            }
            res.isAdmin = true;
            res.save(function(err, res) {
                if (!res){
                    bot.reply('Whoops, i fucked up while saving the user - check the logs boss');
                } else {
                    bot.reply('Allrihgt, ' + name + ' is now Admin');
                }
            });
        });
    };

    var update = function(bot, message) {
        if (message.fromAdmin) {
            bot.reply(message, 'You cannot update, you are not an admin!');
            return;
        } else {
            slack.loadAllBots(config.botPath, bot);
            bot.reply(message, 'Allright!');
        }
    };
    var connect = function(config) {
        return slack.controller.spawn(config).startRTM(function(err, bot) {
                var teamInfo = bot.team_info;
                MongoStorage.team.findOne({'slackTeam.id': teamInfo.id}).exec(function(err, res) {
                    if (!res) {
                        var team = new MongoStorage.team();
                        team.slackTeam = teamInfo;
                        team.save(function(err, res) {
                            if (!res) {
                                console.log(err);
                                new Error('COULD NOT SAVE TEAM');
                            }
                        });
                    }
                });
            });
    };

    if (!process.env.token) {
      console.log('Error: Specify token in environment');
      process.exit(1);
    }

    var bot = connect({
        token: process.env.token
    });


    slack.controller.middleware.receive.use(slack.messageLog);
    slack.controller.middleware.receive.use(slack.auth);
    slack.controller.middleware.receive.use(slack.botActive);
    slack.controller.middleware.receive.use(wit.receive);

    slack.controller.middleware.send.use(slack.checkBotActive);

    //auth middleware

    slack.controller.on('rtm_open', function() {
        var botPath = config.botPath;
        slack.loadAllBots(botPath, bot, wit.hears);

    });
    //reconnect if connection is lost
    slack.controller.on('rtm_close', function() {
        bot = connect({
            token: process.env.token
        });
    });

    //the botLoaderBot
    slack.controller.hears(['update'], 'direct_message,direct_mention', update);
    slack.controller.hears(['list bots'], 'direct_message,direct_mention', listAllBots);
    slack.controller.hears(['enable (.*)'], 'direct_message,direct_mention', botLoadCB);
    slack.controller.hears(['disable (.*)'], 'direct_message,direct_mention', botUnLoadCB);
    slack.controller.hears(['(.*) help', 'help (.*)'], 'direct_message,direct_mention', botHelpCB);
    slack.controller.hears(['make admin (.*)'], 'direct_message,direct_mention', addAdminCB);

}
