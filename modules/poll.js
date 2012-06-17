var poll = function(dbot) {
    if(!dbot.db.hasOwnProperty('polls')) {
        dbot.db.polls = {};
    }

    var polls = dbot.db.polls;
    var commands = {
        '~newpoll': function(event) {
            var name = event.input[1];
            var options = event.input[2].split(',');
            var description = event.input[3];
            
            if(name === undefined || name === 'help') {
                event.reply(dbot.t('newpoll_usage'));
            } else {
                if(polls.hasOwnProperty(name)) {
                    event.reply(dbot.t('poll_exists', {'name': name}));
                } else {
                    polls[name] = {
                        'name': name,
                        'description': description,
                        'owner': event.user,
                        'votes': {},
                        'votees': {}
                    };

                    for(var i=0;i<options.length;i++) {
                        polls[name]['votes'][options[i]] = 0;
                    }
                    
                    event.reply(dbot.t('poll_created', {'name': name, 'description': description}) + 
                        ' - http://nc.no.de:443/polls/' + name);
                }
            }
        },

        '~addoption': function(event) {
            var name = event.input[1];
            var option = event.input[2];
            
            if(polls.hasOwnProperty(name)) {
                if(polls[name].owner === event.user) {
                    if(!polls[name].votes.hasOwnProperty(name)) {
                        polls[name]['votes'][option] = 0;
                        event.reply(dbot.t('option_added'), {'user': event.user, 
                            'name': name, 'option': option});
                    } else {
                        event.reply(dbot.t('option_exists'), {'option': option,
                            'name': name, 'user': event.user});
                    }
                } else {
                    event.reply(dbot.t('not_poll_owner', {'user': event.user,
                        'name': name}));
                }
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        },

        '~rmoption': function(event) {
            var name = event.input[1];
            var option = event.input[2];
            
            if(polls.hasOwnProperty(name)) {
                if(polls[name].owner === event.user) {
                    if(polls[name].votes.hasOwnProperty(option)) {
                        delete polls[name]['votes'][option];
                        event.reply(dbot.t('option_removed'), {'user': event.user,
                            'name': name, 'option': option});
                    } else {
                        event.reply(dbot.t('invalid_vote'), {'vote': option});
                    }
                } else {
                    event.reply(dbot.t('not_poll_owner', {'name': name}));
                }
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        },

        '~vote': function(event) {
            var name = event.input[1];
            var vote = event.input[2];

            if(polls.hasOwnProperty(name)) {
                if(polls[name].votes.hasOwnProperty(vote)) {
                    if(polls[name].votees.hasOwnProperty(event.user)) {
                        var oldVote = polls[name].votees[event.user];
                        polls[name].votes[oldVote]--;
                        polls[name].votes[vote]++;
                        polls[name].votees[event.user] = vote;
                        event.reply(dbot.t('changed_vote', {'vote': vote, 'poll': name,
                            'count': polls[name].votes[vote], 'user': event.user}));
                    } else {
                        polls[name].votes[vote]++;
                        polls[name].votees[event.user] = vote;
                        event.reply(dbot.t('voted', {'vote': vote, 'poll': name,
                            'count': polls[name].votes[vote], 'user': event.user}));
                    }
                } else {
                    event.reply(dbot.t('invalid_vote', {'vote': vote}));
                }
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        },

        '~pdesc': function(event) {
            var name = event.input[1];
            if(polls.hasOwnProperty(name)) {
                event.reply(name + ': ' + polls[name].description + ' - http://nc.no.de:443/polls/' + name);
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        }
    };
    commands['~newpoll'].regex = [/~newpoll ([^ ]+) \[options=([^ ]+)\] (.+)/, 4];
    commands['~addoption'].regex = [/~addoption ([^ ]+)/, 2];
    commands['~rmoption'].regex = [/~rmoption ([^ ]+)/, 2];
    commands['~vote'].regex = [/~vote ([^ ]+) ([^ ]+)/, 3];
    commands['~pdesc'].regex = [/~pdesc ([^ ]+)/, 2];

    return {
        'name': 'poll',
        'ignorable': true,
        'commands': commands
    };
};

exports.fetch = function(dbot) {
    return poll(dbot);
}
