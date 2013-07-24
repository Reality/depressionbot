var Wordnik = require('wordnik');

var words = function(dbot) {
    this.commands = {
        '~define': function(event) {
            var query = event.params[1];
            this.wn.definitions(query, function(err, defs) {
                if(!err && defs[0]) {
                    event.reply(query + ': ' + defs[0].text);
                } else {
                    event.reply('No definitions found for ' + query);
                }
            });
        },
        
        '~jimble': function(event) { 
            event.reply(event.params[1].split('').sort(function() { 
                return (Math.round(Math.random()) - 0.5);
            }).join(''));  
        } 
    };
    this.commands['~jimble'].regex = [/^~jimble (.+)$/, 2];

    this.onLoad = function() {
        this.wn = new Wordnik({
            'api_key': this.config.api_key
        });
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new words(dbot);
};
