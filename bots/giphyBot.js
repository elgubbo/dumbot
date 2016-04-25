var slack = require('../base.js');
var request = require('request');
var config = require('../config_prod.js');

var giphyCB = function(bot, message) {
    var search = message.match[1];
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
        console.log(error);
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            body = body.data;
            var firstRes = body[0];
            console.log(firstRes);
            attachment.attachments[0].text = firstRes.url;
            attachment.attachments[0].image_url = firstRes.images.downsized.url;
            bot.reply(message, attachment);
        }
    })
};

exports.giphy = {
    keywords: ['giphy (.*)'],
    context: 'direct_message,direct_mention,mention',
    cb: giphyCB,
    description: 'Search and display a gif'
};
