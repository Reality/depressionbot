/**
 * Module Name: Command
 * Description: An essential module which maps PRIVMSG input to an appropriate
 * command and then runs that command, given the user isn't banned from or
 * ignoring that command.
 */
var _ = require('underscore')._;

var command = function(dbot) {
    /**
     * Run the appropriate command given the input.
     */
    this.listener = function(event) {
        var commandName = event.params[0];
        if(!_.has(dbot.commands, commandName)) {
            if(_.has(dbot.modules, 'quotes')) {
                commandName = '~';
            } else {
                return;
            }
        } 
       
        this.api.hasAccess(event.rUser, commandName, function(hasAccess) {
            dbot.api.ignore.isUserIgnoring(event.rUser, commandName, function(isIgnoring) {
                dbot.api.ignore.isUserBanned(event.rUser, commandName, function(isBanned) {
                    if(isBanned) {
                        if(this.config.banOutput && commandName != '~') {
                            event.reply(dbot.t('command_ban', {'user': event.user})); 
                        }
                    } else if(!hasAccess) {
                        if(this.config.accessOutput) {
                            event.reply(dbot.t('access_denied', { 'user': event.user }));
                        }
                    } else if(!isIgnoring && !dbot.commands[commandName].disabled) {
                        if(this.api.applyRegex(commandName, event)) {
                            try {
                                var command = dbot.commands[commandName];
                                var results = command.apply(dbot.modules[command.module], [event]);
                            } catch(err) {
                                if(dbot.config.debugMode == true) {
                                    var stack = err.stack.split('\n').slice(1, dbot.config.debugLevel + 1);

                                    event.reply('- Error in ' + commandName + ':');
                                    event.reply('- Message: ' + err);

                                    _.each(stack, function(stackLine, index) {
                                        event.reply('- Stack[' + index + ']: ' +
                                            stackLine.trim());
                                    });
                                }
                            }
                            if(!_.include(['~reload', '~load', '~unload'], commandName)) dbot.api.event.emit('command', [ event ]);
                            dbot.save();
                        } else {
                            if(commandName !== '~') {
                                if(_.has(dbot.usage, commandName)) {
                                    event.reply('Usage: ' + dbot.usage[commandName]);
                                } else {
                                    event.reply(dbot.t('syntax_error'));
                                }
                            }
                        }
                    }
                }.bind(this));
            }.bind(this));
        }.bind(this));
    }.bind(this);
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new command(dbot);
};
