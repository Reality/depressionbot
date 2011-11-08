var quotes = function(dbot) {
    var quotes = dbot.db.quoteArrs;
    var addStack = [];
    var rmAllowed = true;
    
    var commands = {
        '~q': function(data, params) { 
            var q = data.message.valMatch(/^~q ([\d\w\s]*)/, 2);
            if(q) {
                key = q[1].trim().toLowerCase();
                if(quotes.hasOwnProperty(key)) {
                    dbot.say(data.channel, key + ': ' + quotes[key].random());
                } else {
                    dbot.say(data.channel, 'Nobody loves ' + key);
                }
            }
        },

        '~qsearch': function(data, params) {
            if(params[2] === undefined) {
                dbot.say(data.channel, 'Next time provide a search parameter. Commence incineration.');
            } else {
                if(!quotes.hasOwnProperty(params[1])) {
                    dbot.say(data.channel, 'That category has no quotes in it. Commence incineration.');
                } else {
                    var matches = [];
                    
                    quotes[params[1]].each(function(quote) {
                        if(quote.indexOf(params[2]) != -1) {
                            matches.push(quote);
                        }
                    }.bind(this));

                    if(matches.length == 0) {
                        dbot.say(data.channel, 'No results found.');
                    } else {
                        dbot.say(data.channel, params[1] + ' (' + params[2] + '): ' + matches.random() + ' [' + matches.length + ' results]');
                    }
                }
            }
        },

        '~rmlast': function(data, params) {
            if(rmAllowed == true || data.user == dbot.admin) {
                var q = data.message.valMatch(/^~rmlast ([\d\w\s]*)/, 2);
                if(q) {
                    q[1] = q[1].trim().toLowerCase();
                    if(quotes.hasOwnProperty(q[1])) {
                        if(!dbot.db.locks.include(q[1])) {
                            var quote = quotes[q[1]].pop();
                            rmAllowed = false;
                            dbot.say(data.channel, '\'' + quote + '\' removed from ' + q[1]);
                        } else {
                            dbot.say(data.channel, q[1] + ' is locked. Commence incineration.');
                        }
                    } else {
                        dbot.say(data.channel, 'No quotes exist under ' + q[1]);
                    }
                } else {
                    var last = addStack.pop();
                    if(last) {
                        if(!dbot.db.locks.include(last)) {
                            quotes[last].pop();
                            rmAllowed = false;
                            dbot.say(data.channel, 'Last quote removed from ' + last + '.');
                        } else {
                            dbot.say(data.channel, last + ' is locked. Commence incineration.');
                        }
                    } else {
                        dbot.say(data.channel, 'No quotes were added recently.');
                    }
                }
            } else {
                dbot.say(data.channel, 'No spamming that shit. Try again in a few minutes...');
            }
        },

        '~qcount': function(data, params) {
            var q = data.message.valMatch(/^~qcount ([\d\w\s]*)/, 2);
            if(q) {
                key = q[1].trim().toLowerCase();
                if(quotes.hasOwnProperty(key)) {
                    dbot.say(data.channel, key + ' has ' + quotes[key].length + ' quotes.');
                } else {
                    dbot.say(data.channel, 'No quotes under ' + key);
                }
            }
        },

        '~qadd': function(data, params) {
            var q = data.message.valMatch(/^~qadd ([\d\w\s]*)=(.+)$/, 3);
            if(q) {
                q[1] = q[1].toLowerCase();
                if(!Object.isArray(quotes[q[1]])) {
                    quotes[q[1]] = [];
                } else {
                    if (q2 in quotes[q[1]]) {
                        dbot.say(data.channel, 'Quote already in DB. Initiate incineration.');
                        return;
                    }
                }
                quotes[q[1]].push(q[2]);
                addStack.push(q[1]);
                rmAllowed = true;
                dbot.say(data.channel, 'Quote saved in \'' + q[1] + '\' (' + quotes[q[1]].length + ')');
            } else {
                dbot.say(data.channel, 'Invalid syntax. Initiate incineration.');
            }
        },

        '~qset': function(data, params) {
            var q = data.message.valMatch(/^~qset ([\d\w\s]*)=(.+)$/, 3);
            if(q) {
                q[1] = q[1].toLowerCase();
                if(!quotes.hasOwnProperty(q[1]) || (quotes.hasOwnProperty(q[1]) && 
                        quotes[q[1]].length == 1)) {
                    quotes[q[1]] = [q[2]];
                    dbot.say(data.channel, 'Quote saved as ' + q[1]);
                } else {
                    dbot.say(data.channel, 'No replacing arrays, you whore.');
                }
            }
        },

        '~rq': function(data, params) {
            var rQuote = Object.keys(quotes).random();
            dbot.say(data.channel, rQuote + ': ' + quotes[rQuote].random());
        },
        
        '~reality': function(data, params) {
            dbot.say(data.channel, dbot.db.quoteArrs['realityonce'].random());
        },

        '~d': function(data, params) {
            dbot.say(data.channel,  data.user + ': ' + dbot.db.quoteArrs['depressionbot'].random());
        },
        
        '~link': function(data, params) {
            if(params[1] === undefined || !quotes.hasOwnProperty(params[1])) {
                dbot.say(data.channel, 'Syntax error. Commence incineration.');
            } else {
                dbot.say(data.channel, 'Link to "'+params[1]+'" - http://nc.no.de:443/quotes/'+params[1]);
            }
        }

    };

    return {
        'onLoad': function() {
            dbot.timers.addTimer(1000 * 60 * 3, function() {
                rmAllowed = true;
            });
            return commands;
        },

        // For automatic quote retrieval
        'listener': function(data, params) {
            if(data.user == 'reality') {
                var once = data.message.valMatch(/^I ([\d\w\s,'-]* once)/, 2);
            } else {
                var once = data.message.valMatch(/^reality ([\d\w\s,'-]* once)/, 2);
            }

            if(once) {
                if((dbot.db.bans.hasOwnProperty('~qadd') &&
                dbot.db.bans['~qadd'].include(data.user)) ||
                dbot.db.bans['*'].include(data.user)) {
                    dbot.say(data.channel, data.user + ' is banned from using this command. Commence incineration.'); 
                } else {
                    dbot.db.quoteArrs['realityonce'].push('reality ' + once[1] + '.');
                    addStack.push('realityonce');
                    rmAllowed = true;
                    dbot.instance.say(data.channel, '\'reality ' + once[1] + '.\' saved.');
                }
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return quotes(dbot);
};