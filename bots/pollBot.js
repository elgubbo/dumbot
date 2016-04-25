var FRUITEMOTICONS = [':lemon:', ':apple:', ':tangerine:', ':cherries:', ':grapes:', ':watermelon:', ':strawberry:', ':peach:', ':melon:', ':banana:', ':pineapple:', ':pear:'];
var EMOTICONS = [':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:', ':ten:'];

var buildPoll = function(parts) {
    if( !(Object.prototype.toString.call( parts ) === '[object Array]')) {
        return false;
    }
    var attachment = {
        'text': "There is a new poll! React to this poll with the emoticon left of your preferred answer! \n",
        'attachments': [
          {
            'title': '',
            'text': '',
            'color': "#36a64f",
          }
        ],
    };
    parts.forEach(function(part, index) {
        if ((index < FRUITEMOTICONS.length) && (index!==0)) {
          attachment.attachments[0].text = attachment.attachments[0].text + FRUITEMOTICONS[index-1] + ": " + part.replace(/"([^"]+(?="))"/g, '$1') +"\n";
        } else {
            attachment.attachments[0].title = part.replace(/"([^"]+(?="))"/g, '$1') + "\n"
        }
        });
    return attachment;
}

var pollCB = function(bot, message) {
    var pollString = message.match[1];
    var pollParts = pollString.match(/(?:[^\s"]+|"[^"]*")+/g);
    var attachment = buildPoll(pollParts);
    console.log(attachment);
    bot.reply(message, attachment, function(err, m2) {
        if (!err) {
            var reactionAmount = pollParts.length-1;
            var emotiArray = FRUITEMOTICONS.slice(0, reactionAmount).map(function(item) {
                return item.replace(':', '');
            });
            for (var i = 0; i < emotiArray.length; i++) {
                bot.api.reactions.add({
                    timestamp: m2.ts,
                    channel: m2.channel,
                    name: emotiArray[i].replace(':', ''),
                }, function(err, res) {
                    if (err) {
                        bot.botkit.log('Failed to add emoji reaction :(', err);
                    }
                });
            }
        }
    });
};


exports.poll = {
    keywords: ['poll (.*)'],
    context: 'direct_mention',
    cb: pollCB,
    description: 'Say "poll question answer answer answer" and this bot will create a poll in the channel'
};