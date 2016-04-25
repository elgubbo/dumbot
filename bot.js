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
	if (!process.env.token) {
	  console.log('Error: Specify token in environment');
	  process.exit(1);
	}
	var bot = slack.controller.spawn({
	    token: process.env.token
	}).startRTM();
	var botPath = './bots/';
	slack.loadAllBots(botPath, bot);
	//the botLoaderBot
	slack.controller.hears(['update'], 'direct_message,direct_mention', slack.update);
	slack.controller.hears(['enable (.*)'], 'direct_message,direct_mention', botLoadCB);
	slack.controller.hears(['disable (.*)'], 'direct_message,direct_mention', botUnLoadCB);

}
