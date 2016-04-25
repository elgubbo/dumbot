var request = require('request');

var tellJoke = function(bot, message) {
    request('http://api.icndb.com/jokes/random', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body);
        bot.reply(message, body.value.joke);
      }
    })
};


exports.joke = {
    keywords: ['tell me a joke'],
    context: 'direct_mention',
    cb: tellJoke,
    description: 'Tells you a joke'
};