/**
 * Module Name: Ignore
 * Description: Handles commands in which users can choose to ignore listeners
 * and commands from certain modules. It also populates the JSBot instance with
 * this information, since that actually performs the ignorance.
 */
var _ = require('underscore')._;

var ignore = function(dbot) {
    var commands = {
        '~ignore': function(event) {
            var module = event.params[1];
            var ignorableModules = _.chain(dbot.modules)
                .filter(function(module) {
                    return module.ignorable !== null && module.ignorable === true;
                })
                .pluck('name')
                .value();

            if(_.isUndefined(module)) {
                event.reply(dbot.t('ignore_usage', {
                    'user': event.user, 
                    'modules': ignorableModules.join(', ')
                }));
            } else {
                if(_.include(ignorableModules, module)) {
                    if(_.has(dbot.db.ignores, event.user) && _.include(dbot.db.ignores[event.user], module)) {
                        event.reply(dbot.t('already_ignoring', { 'user': event.user }));
                    } else {
                        if(_.has(dbot.db.ignores, module)) {
                            dbot.db.ignores[event.user].push(module);
                        } else {
                            dbot.db.ignores[event.user] = [module];
                        }

                        dbot.instance.ignoreTag(event.user, module);
                        event.reply(dbot.t('ignored', {
                            'user': event.user, 
                            'module': module
                        }));
                    }
                } else {
                    event.reply(dbot.t('invalid_ignore', { 'user': event.user }));
                }
            }
        }, 

        '~unignore': function(event) {
            var ignoredModules = [];
            if(_.has(dbot.db.ignores, event.user)) {
                ignoredModules = dbot.db.ignores[event.user];
            }
            var module = event.params[1];

            if(_.isUndefined(module)) {
                event.reply(dbot.t('unignore_usage', {
                    'user': event.user, 
                    'modules': ignoredModules.join(', ')
                }));
            } else {
                if(_.include(ignoredModules, module)) {
                    dbot.db.ignores[event.user].splice(dbot.db.ignores[event.user].indexOf(module), 1);
                    dbot.instance.removeIgnore(event.user, module)
                    event.reply(dbot.t('unignored', { 
                        'user': event.user, 
                        'module': module
                    }));
                } else {
                    event.reply(dbot.t('invalid_unignore', { 'user': event.user }));
                }
            }
        }
    };

    return {
        'name': 'ignore',
        'ignorable': false, 
        'commands': commands,

        'onLoad': function() {
            dbot.instance.clearIgnores();
            _.each(dbot.db.ignores, function(ignores, user) {
                _.each(ignores, function(ignore) {
                        dbot.instance.ignoreTag(user, ignore);
                }, this);
            }, this);
        }
    };
};

exports.fetch = function(dbot) {
    return ignore(dbot);
};
