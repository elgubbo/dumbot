var slack = require('../base.js');
var os = require('os');
var config = require('../config_prod.js');
var restartCB = function(bot, message) {
    if (!message.fromAdmin) {
        bot.reply(message, 'Forget it!');
    } else {
        bot.startConversation(message, function(err, convo) {

            convo.ask('Are you sure you want me to shutdown?', [
                {
                    pattern: bot.utterances.yes,
                    callback: function(response, convo) {
                        convo.say('Bye!');
                        convo.next();
                        setTimeout(function() {
                            process.exit(3);
                        }, 3000);
                    }
                },
            {
                pattern: bot.utterances.no,
                default: true,
                callback: function(response, convo) {
                    convo.say('*Phew!*');
                    convo.next();
                }
            }
            ]);
        });
    }
};

var uptimeCB = function(bot, message) {

    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message,
        ':robot_face: I am a bot named <@' + bot.identity.name +
         '>. I have been running for ' + uptime + ' on ' + hostname + '. \n You can check my source code at: https://github.com/elgubbo/dumbot');

};

var formatUptime = function(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}


exports.uptime = {
    keywords: ['uptime'],
    context: 'direct_message,direct_mention,mention,ambient',
    cb: uptimeCB,
    description: 'Say "uptime" and this bot will tell you how long its awake'
};
exports.restart = {
    keywords: ['restart'],
    context: 'direct_message,direct_mention',
    cb: restartCB,
    description: 'Say "restart" and this bot will restart'
};