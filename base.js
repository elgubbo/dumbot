var Botkit = require('botkit');
var config = require('./config_prod.js');
var MongoStorage = require('./storage/mongo-storage.js')();
var mongoose = require('mongoose');
var fs = require('fs');


if (config.db.hasOwnProperty('mongo')) {
	console.log('MONGO CONFIG');
	mongoose.connect(config.db.mongo.connectionString, config.db.mongo.options || {});
	var controller = Botkit.slackbot({
	    debug: config.debug,
	});
} else {
	new Error('COULD NOT CONNECT TO MONGODB');
}

exports.controller = controller;

//'auth' middleware that checks if the user has admin status, authorization happens on a action level
exports.auth = function(bot, message, next) {
    MongoStorage.user.findOne({'id': message.user}, function(err, user) {
    	if (user && user.isAdmin) {
    		message.fromAdmin = true;
    		next();
    	}
    });
}

//checks if bot is allowed for the message
exports.botAllowed = function(botName, message) {
	return !(message.disabledBots.indexOf(botName) > -1);
}

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
							if (ind = cD.indexOf(td[i]) > 0)
								cD.splice(ind);
						}
						for (var i = cD.length - 1; i >= 0; i--) {
							if (ind = tD.indexOf(cD[i]) > 0)
								tD.splice(ind);
						}
						message.disabledBots = tD.concat(cD);
					} else {
						if (team.disabledBots)
							message.disabledBots = team.disabledBots;
						else {
							message.disabledBots = [];
						}
					}
				}
    			next();
			})
		}
    });
}


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
			controller.debug('LOADBOT: BOT NOT RECEIVED')
			return;
		}
		var tempBot = require(subBot.path);
		for (var action in tempBot) {
			controller.hears(tempBot[action].keywords, tempBot[action].context, witMiddelware, tempBot[action].cb);
		}
		controller.debug('LOADED BOT '+subBot.id)
		if (message && message !== 'internal')
			bot.reply(message, 'Bot '+subBot.id+' loaded');
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
		            }
	            });
	            for (var i = bots.length - 1; i >= 0; i--) {
	            	MongoStorage.bot.findOne({'name': bots[i].name}, function(bot, err, res) {
	            		console.log(bot);
	            		if (!err) {
	            			if (!res) {
	            				var botModel = new MongoStorage.bot(bot);
	            				botModel.save();
	            			}
	            		}
	            	}.bind(this, bots[i]))
	            	loadBot(bots[i], 'internal', bot, witMiddelware);
	            }
	        });
	    }
	});
};

exports.loadAllBots = loadAllBots;
