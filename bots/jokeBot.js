var request = require('request');
var config = require('../config_prod.js');
var botName = 'jokeBot';
var slack = require('../base.js');

var tellJoke = function(bot, message) {
    if (!slack.botAllowed(botName, message))
        return;
    request('http://api.icndb.com/jokes/random', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body);
        bot.reply(message, body.value.joke);
      }
    })
};


exports.joke = {
    keywords: ['joke'],
    context: 'direct_mention,direct_message',
    cb: tellJoke,
    description: 'Tells you a joke'
};