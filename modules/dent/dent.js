var request = require('request');
    _ = require('underscore')._;

var dent = function(dbot) {
    this.dbot = dbot;

    this.api = {
        'post': function(content) {
            var username = dbot.config.dent.username,
                password = dbot.config.dent.password,
                info,
                auth = "Basic " +
                new Buffer(username + ":" + password).toString("base64");

            request.post({
                'url': 'http://identi.ca/api/statuses/update.json?status=' +
                    escape(content),
                'headers': {
                    'Authorization': auth
                }
            },
            function(error, response, body) {
                console.log(body);
            }.bind(this));
        }
    };

    this.commands = {
        '~dent': function(event) {
            this.api.post(event.input[1]);
            event.reply('Dent posted (probably).');
        }
    };
    this.commands['~dent'].regex = [/^~dent (.+)$/, 2];

    this.onLoad = function() {
        if(dbot.config.dent.dentQuotes === true && _.has(dbot.modules, 'quotes')) {
            dbot.api.command.addHook('~qadd', function(key, text) {
                this.api.post(key + ': ' + text);
            }.bind(this));
        }
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new dent(dbot);
};
