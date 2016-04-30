var ralph = require('../storage/raw/ralphquotes.js');
var MongoStorage = require('../storage/mongo-storage.js')();
var botName = 'ralphBot';


var ralphQuote = function(bot){
	var quotes = ralph.quotes;
	var quote = quotes[Math.floor(Math.random()*quotes.length)];
	MongoStorage.channel.random(function(err, res) {
		if (res) {
			bot.say({text: quote, channel: res.id, 'botName': botName});
		}
	});
	setTimeout(arguments.callee, 120*60*1000);
};

exports.quote = {
	keywords: ['none'],
	type: 'function',
	context: 'none',
	cb: ralphQuote,
	description: 'Allows this bot to say what it thinks once on a while'
};