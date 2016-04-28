var slack = require('../base.js');
var request = require('request');
var config = require('../config_prod.js');
var botName = 'giphyBot';

var giphyCB = function(bot, message) {
    if (!slack.botAllowed(botName, message))
        return;
    console.log(message.intents);
    var search = message.intents[0].entities.gif_type[0].value;
    search = encodeURIComponent(search);
    var attachment = {
        'text': "",
        'attachments': [
          {
            'title': "Here's your Giphy",
            'text': '',
            'color': "#36a64f",
          }
        ],
    };
    request('http://api.giphy.com/v1/gifs/search?q='+search+'&api_key='+config.apiKeys.giphy, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            body = body.data;
            if (!body.length) {
                bot.reply(message, 'Could not find a gif for ' + search + ' i\'m sorry :(');
                return;
            }
            var firstRes = body[0];
            attachment.attachments[0].text = firstRes.url;
            attachment.attachments[0].image_url = firstRes.images.downsized.url;
            bot.reply(message, attachment);
        }
    })
};

exports.giphy = {
    keywords: ['gif'],
    context: 'direct_message,direct_mention,mention',
    cb: giphyCB,
    description: 'Search and display a gif'
};
