/** 
 * Module Name: Remind
 * Description: Reminds you
 */

var crypto = require('crypto'),
    moment = require('moment'),
    _ = require('underscore')._;

var remind = function(dbot) {
    var self = this;

    this.api = {
        'parseTime': function(time) {
            var components = time.match(/[0-9]+[ydhms]/g);
            if (!components)
                return;

            var seconds = 0;
            for (var i=0; i < components.length; ++i) {
                var value = parseInt(components[i].match(/[0-9]+/)[0]),
                    component = components[i].match(/[ydhms]/)[0];

                if (!component)
                    return;

                seconds += this.internalAPI.getSeconds(value,component);
            }

            return new Date(Date.now() + (seconds * 1000));
        }
    };

    this.internalAPI = {
        'parseParams': function(params) {
            var i;
            for(i=0; i < params.length; ++i) {
                if(!params[i].match(/^[0-9]+?[ydhms]$/))
                    break;
            }

            var time = params.slice(0,i).join(''),
                message = params.slice(i, params.length).join(' ');

            if (dbot.config.debugMode) {
                console.log("time: " + time + " [0:" + i.toString() + "]");
                console.log("message: " + message + " [" + i.toString() + ":" + params.length.toString() + "]");
            }

            return [time,message];
        }.bind(this),

        'getSeconds': function(value,component) {
            switch(component) {
                case "y":
                    return value * 365 * 60 * 60;
                case "d":
                    return value *  24 * 60 * 60;
                case "h":
                    return value *       60 * 60;
                case "m":
                    return value *            60;
                case "s":
                    return value;
            }
        }.bind(this),

        'doReminder': function(event, user, time, message) {
            var then = this.api.parseTime(time);
            if(!then)
                return event.reply("The time parameter was not a valid time mah boy, it was "+time);

            if(dbot.config.debugMode)
                event.reply("The timer will be at "+then);

            this.internalAPI.startTimer(event.server,event.channel,then,event.user,user,message);
            this.internalAPI.saveTimer(event.server,event.channel,then,event.user,user,message);

            if(message)
                event.reply("I have set the timer with your message \""+message+"\"");
            else
                event.reply("I have set the timer.");
        }.bind(this),

        'startTimer': function(server, channel, time, starter, target, message) {
            var cb = function() {
                if(message) {
                    if(starter === target) {
                        dbot.say(server,channel,target+": This is your reminder. You left a message: "+message);
                    } else {
                        dbot.say(server,channel,target+": This is your reminder. "+starter+" left a message: "+message);
                    }
                } else {
                    if(starter === target) {
                        dbot.say(server,channel,target+": This is your reminder. You did not leave a message.");
                    } else {
                        dbot.say(server,channel,target+": This is your reminder. "+starter+" did not leave a message.");
                    }
                }
                var hash = self.internalAPI.getHashForTime(time);
                if(dbot.config.debugMode)
                    dbot.say(server,channel,"Removing timer with hash "+hash);
                delete dbot.db.remindTimers[hash];
            };
            dbot.api.timers.addTimeout(time,cb,null);
            if(dbot.config.debugMode)
                dbot.say(server,channel,"Timer queued for "+time);
        }.bind(this),

        'saveTimer': function(server,channel,time,starter,target,message) {
            var hash = this.internalAPI.getHashForTime(time);
            dbot.db.remindTimers[hash] = {server:server, channel:channel.name, time:time.valueOf(), starter:starter, target:target, message:message};
        }.bind(this),

        'getHashForTime': function(time) {
            var md5 = crypto.createHash('md5');
            console.log(time.valueOf().toString());
            md5.update(time.valueOf().toString());
            return hash = md5.digest('hex');
        }.bind(this)
    };

    this.commands = {
        '~remind': function(event) {
            if(event.params.length < 3) {
                event.reply("You need to give me a user and time dude.");
                return;
            }

            var r = this.internalAPI.parseParams(event.params.slice(2, event.params.length));
            this.internalAPI.doReminder(event, event.params[1], r[0], r[1]);
        },

        '~remindme': function(event) {
            if(event.params.length < 2) {
                event.reply("You need to give me a time dude.");
                return;
            }

            var r = this.internalAPI.parseParams(event.params.slice(1, event.params.length));
            this.internalAPI.doReminder(event, event.user, r[0], r[1]);
        },

        '~myreminders': function(event) {
            var reminders = _.filter(dbot.db.remindTimers, function(t){ return t.target == event.user; });
            if(_.size(reminders) > 0) {
                var output = '';
                _.each(reminders, function(reminder, i) {
                    output += (i+1) + ': "' + reminder.message + '" in ' + moment(reminder.time).toNow(true) + '. '; 
                });  
                event.reply('You have ' + _.size(reminders) + ' active reminders. ' + output);
            }
            else {
                event.reply('You have no currently active timers.');
            }
        }
    };

    this.onLoad = function() {
        if(!dbot.db.remindTimers) {
            dbot.db.remindTimers = {};
            return;
        }
        for(var i=0;i<Object.keys(dbot.db.remindTimers).length;++i) {
            if(dbot.config.debugMode)
                console.log("Found saved timer "+Object.keys(dbot.db.remindTimers)[i]);
            var prop = dbot.db.remindTimers[Object.keys(dbot.db.remindTimers)[i]];
            if(parseInt(prop.time) < Date.now().valueOf()) {
                if(dbot.config.debugMode)
                    console.log("This timer is old. I shall delete it.");
                delete dbot.db.remindTimers[Object.keys(dbot.db.remindTimers)[i]];
                continue;
            }
            this.internalAPI.startTimer(prop.server,prop.channel,new Date(prop.time),prop.starter,prop.target,prop.message);
        }
    };
};

exports.fetch = function(dbot) {
    return new remind(dbot);
};
