var slack = require('./base.js');
var config = require('./config_prod.js');
var cluster = require('cluster');

//this automatically restarts the process if one worker is killed (eg due to unloading of bots)
if (cluster.isMaster) {
   var i = 0;
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
	    if (message.user !== config.superAdmin) {
	        bot.reply(message, 'You cannot load a bot, you are not an admin!');
	        return;
	    } else {
	        slack.controller.storage.bots.get(name, function(err, subBot) {
	        	if (err) {
	        		console.log(err);
	        		return;
	        	}
	            if (!subBot) {
	                bot.reply(message, 'Cannot find the bot you want to load!');
	            } else {
	            	subBot.active = true;
	        		slack.controller.storage.bots.save(subBot, function(err, id) {
	        			if (err) {
	        				slack.controller.debug(err);
	        				return;
	        			} else {
	            			slack.loadBot(subBot, message, bot);
	        			}
	        		}.bind(this));
	            }
	        }.bind(this));
	    }
	};

	var botUnLoadCB = function(bot, message) {
	    var name = message.match[1];
	    if (message.user !== config.superAdmin) {
	        bot.reply(message, 'You cannot unload a bot, you are not an admin!');
	        return;
	    } else {
	        slack.controller.storage.bots.get(name, function(err, subBot) {
	        	if (err) {
	        		console.log(err);
	        		return;
	        	}
	            if (!subBot) {
	                bot.reply(message, 'Cannot find the bot you want to unload!');
	            } else {
	            	if (subBot.active) {
		            	subBot.active = false;
		        		slack.controller.storage.bots.save(subBot, function(err, res) {
		        			if (err) {
		        				slack.controller.debug(err)
		        				return;
		        			} else {
		                		bot.reply(message, 'Unloaded '+res+'! Restarting now!');
			                    setTimeout(function() {
			                        process.exit();
			                    }, 3000);
		        			}
		        		}.bind(this));
	            	} else {
	            		bot.reply(message, "Bot already disabled! No need to do it again!");
	            	}
	            }
	        }.bind(this));
	    }
	};
	var listAllBots = function(bot, message) {
        slack.controller.storage.bots.all(function(err, botList) {
        	if (err) {
        		controler.debug(err);
        		return;
        	}

		    var reply = {
		        'text': "This is a List of all the bots available \n If you need more information on how an ACTIVE bot works, type help <botname>",
		        'attachments': [
		        ],
		    };

		    var attachments = botList.map(function(item) {
		    	return {
		            'title': item.id,
		            'text': "Active: "+item.active,
		            'color': "#36a64f",
		    	}
		    });
		    reply.attachments = attachments;
            bot.reply(message, reply);

        }.bind(this));
	};

	var botHelpCB = function(bot, message) {
		var id = message.match[1];
		slack.controller.storage.bots.get(id, function(err, subBot) {
			if (!err) {
				var tempBot = require(subBot.path);
				var attachments = [];
			    var reply = {
			        'text': "Here is a Description for "+id+" and its features",
			        'attachments': [
			        ],
			    };
				for (var action in tempBot) {
					attachments.push({
			            'title': action,
			            'text': "Keywords: "+tempBot[action].keywords+'\n Description: '+tempBot[action].description,
			            'color': "#36a64f",
					})
				}
				reply.attachments = attachments;
				bot.reply(message, reply);
			} else {
				bot.reply(message, "Sorry i don't know this bot");
			}
		})
	}

	if (!process.env.token) {
	  console.log('Error: Specify token in environment');
	  process.exit(1);
	}
	var bot = slack.controller.spawn({
	    token: process.env.token
	}).startRTM();
	var botPath = config.botPath;
	slack.loadAllBots(botPath, bot);
	//the botLoaderBot
	slack.controller.hears(['update'], 'direct_message,direct_mention', slack.update);
	slack.controller.hears(['list bots'], 'direct_message,direct_mention', listAllBots);
	slack.controller.hears(['enable (.*)'], 'direct_message,direct_mention', botLoadCB);
	slack.controller.hears(['disable (.*)'], 'direct_message,direct_mention', botUnLoadCB);
	slack.controller.hears(['(.*) help'], 'direct_message,direct_mention', botHelpCB);

}
