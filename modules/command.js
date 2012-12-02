/**
 * Module Name: Command
 * Description: An essential module which maps PRIVMSG input to an appropriate
 * command and then runs that command, given the user isn't banned from or
 * ignoring that command.
 */
var command = function(dbot) {
    /**
     * Is user banned from using command?
     */
    var isBanned = function(user, command) {
        var banned = false;
        if(dbot.db.bans.hasOwnProperty(command)) {
            if(dbot.db.bans[command].include(user) || dbot.db.bans['*'].include(user)) {
                banned = true;
            }
        }
        return banned;
    };

    /**
     * Is user ignoring command?
     */
    var isIgnoring = function(user, command) {
        var module = dbot.commandMap[command];
        var ignoring = false;
        if(dbot.db.ignores.hasOwnProperty(user) && dbot.db.ignores[user].include(module)) {
            ignoring = true;
        }
        return ignoring;
    };

    /**
     * Apply Regex to event message, store result. Return false if it doesn't
     * apply.
     */
    var applyRegex = function(commandName, event) {
        var applies = false;
        if(dbot.commands[commandName].hasOwnProperty('regex')) {
            var cRegex = dbot.commands[commandName].regex;
            var q = event.message.valMatch(cRegex[0], cRegex[1]);
            if(q) {
                applies = true;
                event.input = q;
            }
        } else {
            applies = true;
        }
        return applies;
    };

    return {
        'name': 'command',
        'ignorable': false,

        'commands': {
            '~usage': function(event) {
                var commandName = event.params[0];
                if(dbot.commands.hasOwnProperty(commandName)) {
                    event.reply('Usage for ' + commandName + ': ' +
                        dbot.commands[commandName].usage); 
                } else {
                    event.reply('No usage information for ' + commandName);
                }
            }
        },

        /**
         * Run the appropriate command given the input.
         */
        'listener': function(event) {
            var commandName = event.params[0];
            if(!dbot.commands.hasOwnProperty(commandName)) {
                commandName = '~';
            }

            if(isBanned(event.user, commandName)) {
                event.reply(dbot.t('command_ban', {'user': event.user})); 
            } else {
                if(!isIgnoring(event.user, commandName)) {
                    if(applyRegex(commandName, event)) {
                        dbot.commands[commandName](event);
                        dbot.save();
                    } else {
                        if(commandName !== '~') {
                            if(dbot.commands[commandName].hasOwnProperty('usage')){
                                event.reply('Usage: ' + dbot.commands[commandName].usage);
                            } else {
                                event.reply(dbot.t('syntax_error'));
                            }
                        }
                    }
                }
            }
        },
        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return command(dbot);
};

