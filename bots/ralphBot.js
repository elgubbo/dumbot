var ralph = require('../storage/raw/ralphquotes.js');
var MongoStorage = require('../storage/mongo-storage.js')();
var botName = 'ralphBot';


var ralphQuote = function(bot){
	console.log('ralphQuote');
	var quotes = ralph.quotes;
	var quote = quotes[Math.floor(Math.random()*quotes.length)];
	MongoStorage.channel.random(function(err, res) {
		if (res) {
			console.log('channelId');
			console.log(res.id);
			MongoStorage.message.findOne({'channel': res.id}).sort({'created_at': -1}).exec(
				function(err, messageResult) {
				if (!err) {
					console.log(bot.identity.id);
					if (messageResult && (messageResult.user !== bot.identity.id)) {
						console.log('messageFound');
						console.log(messageResult);
						var created = Date.parse(messageResult.created_at);
						console.log(created);
						console.log(Date.now());
						var isValid = (Date.now() - created) < 30*60*1000;
						console.log(isValid);
						if (isValid) {
							bot.say({text: quote, channel: res.id, 'botName': botName});
						}
					}
				}

			});
		}
	});
	setTimeout(arguments.callee.bind(null, bot), 30*60*1000);
};

exports.quote = {
	keywords: ['none'],
	type: 'function',
	context: 'none',
	cb: ralphQuote,
	description: 'Allows this bot to say what it thinks once on a while'
};