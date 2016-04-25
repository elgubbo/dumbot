var Botkit = require('botkit');
var config = require('./config_prod.js');
var Storage = require('./storage/simple-storage.js');
var fs = require('fs');


var simpleStorage = new Storage({
	path: config.db.jsonPath
});

var controller = Botkit.slackbot({
    debug: false,
  	storage: simpleStorage,
});

exports.controller = controller;

exports.auth = function(bot, message, next) {
    controller.storage.users.get(message.user, function(err, user) {
    	if (user && user.isAdmin) {
    		message.fromAdmin = true;
    	}
    });
    next();
}

/* Load a Bot File during runtime
	@param subBot the bot to be loaded
	@param message the message where the load request came from
*/
var loadBot = function(subBot, message, bot) {
    if (message!=='internal' && config.superAdmin.indexOf(message.user) == -1) {
        bot.reply(message, 'You cannot load a bot, you are not an admin!');
        return;
    } else {
		if (!bot) {
			controller.debug('LOADBOT: BOT NOT RECEIVED')
			return;
		}
		var tempBot = require(subBot.path);
		for (var action in tempBot) {
			controller.hears(tempBot[action].keywords, tempBot[action].context, tempBot[action].cb);
		}
		controller.debug('LOADED BOT '+subBot.id)
		if (message && message !== 'internal')
			bot.reply(message, 'Bot '+subBot.id+' loaded');
	}
};

var loadAllBots = function(botPath, bot) {
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
		            	id : idArray[index],
		            	path: botPath+item,
		            	active: false,
		            }
	            });
	            console.log(bots);
	            for (var i = bots.length - 1; i >= 0; i--) {
	            	(function(subBot) {
		                controller.storage.bots.get(subBot.id, function(err, res) {
		                	console.log(res);
		                    if (!res) {
			                    controller.storage.bots.save(subBot, function(err, id) {
			                    	console.log(err);
			                    	console.log(id);
			                    	//new bot saved
			                    });
		                    } else {
		                    	console.log('loading');
		                    	if (res.active) {
		                    		loadBot(subBot, 'internal', bot);
		                    	}
		                    }
		                });
	            	})(bots[i]);
	            }
	        });
	    }
	});
};

exports.loadBot = loadBot;

exports.loadAllBots = loadAllBots;

exports.update = function(bot, message) {
    if (config.superAdmin.indexOf(message.user) == -1) {
        bot.reply(message, 'You cannot update, you are not an admin!');
        return;
    } else {
		loadAllBots(config.botPath, bot);
		bot.reply(message, 'Allright!');
	}
}