var Botkit = require('botkit');
var config = require('./config_prod.js');
var MongoStorage = require('./storage/mongo-storage.js')();
var mongoose = require('mongoose');
var fs = require('fs');


if (config.db.hasOwnProperty('mongo')) {
    mongoose.connect(config.db.mongo.connectionString, config.db.mongo.options || {});
    var controller = Botkit.slackbot({
        debug: config.debug
    });
} else {
    new Error('COULD NOT CONNECT TO MONGODB');
}

exports.controller = controller;

//'auth' middleware that checks if the user has admin status, authorization happens on a action level
exports.auth = function(bot, message, next) {
    MongoStorage.user.findOne({'id': message.user, 'teamId': message.team}, function(err, user) {
        if (user && user.isAdmin) {
            message.fromAdmin = true;
        }
        next();
    });
};

//'message' middleware saves every incoming message
exports.messageLog = function(bot, message, next) {
    if (message.type === 'message') {
        var messageModel = new MongoStorage.message(message);
        messageModel.save(function(err) {
            if (err) {
                console.log(err);
            } else {
                next();
            }
        });
    }
};

//checks if bot is allowed for the message
exports.botAllowed = function(botName, message) {
    return (message.disabledBots.indexOf(botName) === -1);
};

//checks if bot is active for the channel/team and saves it in the message accordingly
exports.botActive = function(bot, message, next) {
    MongoStorage.team.findOne({'slackTeam.id': bot.team_info.id}, function(err, team) {
        if (!err) {
            MongoStorage.channel.findOne({'id': message.channel}, function(err, channel) {
                if (!err) {
                    if (channel) {
                        var tD = team.disabledBots || [];
                        var cD = channel.disabledBots || [];
                        var ind;
                        for (var i = tD.length - 1; i >= 0; i--) {
                            ind = cD.indexOf(tD[i]);
                            if (ind > 0) {
                                cD.splice(ind);
                            }
                        }
                        for (var j = cD.length - 1; j >= 0; j--) {
                            ind = tD.indexOf(cD[j]);
                            if (ind > 0) {
                                tD.splice(ind);
                            }
                        }
                        message.disabledBots = tD.concat(cD);
                    } else {
                        if (team.disabledBots) {
                            message.disabledBots = team.disabledBots;
                        }
                        else {
                            message.disabledBots = [];
                        }
                    }
                } else {
                    console.log(err);
                }
                next();
            });
        }
    });
};

//checks if bot is active for the channel/team only sends message when it is
exports.botActiveSend = function(bot, message, next) {
    if (!message.botName) {
        next();
        return;
    }
    MongoStorage.team.findOne({'slackTeam.id': bot.team_info.id}, function(err, team) {
        if (!err) {
            MongoStorage.channel.findOne({'id': message.channel}, function(err, channel) {
                if (!err) {
                    if (channel) {
                        var teamDisabledBots = team.disabledBots || [];
                        var channelDisabledBots = channel.disabledBots || [];
                        var enabledForTeam = (teamDisabledBots.indexOf(message.botName) === -1);
                        var enabledForChannel = (channelDisabledBots.indexOf(message.botName) === -1);
                        if (enabledForTeam && enabledForChannel) {
                            next();
                            return;
                        } else {
                            return;
                        }
                    } else {
                        if (team.disabledBots) {
                            if (team.disabledBots.indexOf(message.botName) === -1) {
                                next();
                            }
                        }
                        else {
                            next();
                        }
                    }
                }
                next();
            });
        }
    });
};


/* Load a Bot File during runtime
    @param subBot the bot to be loaded
    @param message the message where the load request came from
*/
var loadBot = function(subBot, message, bot, witMiddelware) {
    if (message!=='internal' && !message.fromAdmin) {
        bot.reply(message, 'You cannot load a bot, you are not an admin!');
        return;
    } else {
        if (!bot) {
            controller.debug('LOADBOT: BOT NOT RECEIVED');
            return;
        }
        var currentBot = require(subBot.path);
        for (var action in currentBot) {
            if (currentBot.hasOwnProperty(action)) {
                switch(currentBot[action].type) {
                    case 'function':
                        currentBot[action].cb(bot);
                        break;
                    default :
                        controller.hears(currentBot[action].keywords, currentBot[action].context, witMiddelware, currentBot[action].cb);
                        break;
                }
            }
        }
        controller.debug('LOADED BOT '+subBot.id);
        if (message && message !== 'internal') {
            bot.reply(message, 'Bot '+subBot.id+' loaded');
        }
    }
};

var loadAllBots = function(botPath, bot, witMiddelware) {
        //Loading all bots in botPath
    fs.lstat(botPath, function(err, stat) {
        if (stat.isDirectory()) {
            fs.readdir(botPath, function(err, files) {
                console.log(files);
                var idArray = files.map(function(item) {
                        return item.split('.')[0];
                    });
                var bots = files.map(function(item, index) {
                    return {
                        name : idArray[index],
                        path: botPath+item,
                    };
                });
                var foundCallBack = function(bot, err, res) {
                    if (!err) {
                        if (!res) {
                            var botModel = new MongoStorage.bot(bot);
                            botModel.save();
                        }
                    }
                };
                for (var i = bots.length - 1; i >= 0; i--) {
                    MongoStorage.bot.findOne({'name': bots[i].name}, foundCallBack.bind(this, bots[i]));
                    loadBot(bots[i], 'internal', bot, witMiddelware);
                }
            });
        }
    });
};

exports.loadAllBots = loadAllBots;
