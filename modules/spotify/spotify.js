/**
 * Name: Spotify
 * Description: Various Spotify functionality
 */
var request = require('request'),
        _ = require('underscore')._;

var spotify = function(dbot) {
    this.spotifySearch = 'https://api.spotify.com/v1/search';
    this.youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    this.spotifyText = '\u00039spotify\u000f';
    this.spotifyAuthUrl = 'https://accounts.spotify.com/api/token';
    
    this.auth = false;
    
    this.authenticate = function(callback) {
        this.auth = this.auth || new Buffer(this.config.api_key_clientid + ":" + this.config.api_key_clientsecret).toString("base64");
        
        request({
            url: this.spotifyAuthUrl,
            method: "POST",
            headers: { Authorization: "Basic " + this.auth },
            form: { grant_type: "client_credentials" }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                var token = body.access_token;
                callback(token);
            }
        });
    };

    this.api = {
        'spotifySearch': function(query, callback) {
            this.authenticate(function(token) {
                request({
                    'url': this.spotifySearch,
                    'qs': { 'q': query, 'type': 'track' },
                    'json': true,
                    'headers': { 'Authorization': "Bearer " + token }
                }, function(error, response, body) {
                    if(!error && response.statusCode == 200) {
                        if(_.has(body, 'tracks') && body.tracks.items[0] && _.has(body.tracks.items[0], 'href')) {
                            var url = body.tracks.items[0].href;
                            url = url.replace(/api.spotify.com\/v1\/tracks/, 'open.spotify.com/track');
                            callback(body, url, body.tracks.items[0].uri);
                        } else {
                            callback(false);
                        }
                    }
                });
            }.bind(this));
        },
        
        'getMinifiedSpotifyLink': function(link, callback) {
            if(!dbot.modules.minify) {
                callback();
            } else {
                dbot.modules.minify.api.minify(link, "bitly", callback);
            }
        }
    };

    var commands = {
        '~spotify': function(event) {
            var query = event.input[1];
            this.api.spotifySearch(query, function(body, t) {
                if(body) {
                    this.api.getMinifiedSpotifyLink(t, function(mini) {
                        event.reply(dbot.t('found', {
                            'artist': _.map(body.tracks.items[0].artists, function(a) { 
                                    return a.name }).join(', '), 
                            'album': body.tracks.items[0].album.name, 
                            'track': body.tracks.items[0].name, 
                            'url': mini || t,
                            'uri': body.tracks.items[0].uri
                        }));
                    });
                } else {
                    event.reply(dbot.t('not-found'));
                }
            }.bind(this));
        },

        '~syt': function(event) {
            var lastLink = dbot.modules.link.links[event.channel.name];
            if(!_.isUndefined(event.params[1])) {
                lastLink = event.params[1];
            }

            if(lastLink.match(this.youtubeRegex)) {
                dbot.api.link.getTitle(lastLink, function(title) {
                    name = title.replace(' - YouTube', '');
                    this.api.spotifySearch(name, function(body, t) {
                        if(body) {
                            this.api.getMinifiedSpotifyLink(t, function(mini) {
                                event.reply(dbot.t('found', {
                                    'artist': _.map(body.tracks.items[0].artists, 
                                        function(a) { return a.name }).join(', '), 
                                    'album': body.tracks.items[0].album.name, 
                                    'track': body.tracks.items[0].name, 
                                    'url': mini || t,
                                    'uri': body.tracks.items[0].uri
                                }));
                            });
                        } else {
                            event.reply(dbot.t('not-found'));
                        }
                    }.bind(this));
                }.bind(this));
            } else {
                event.reply('That\'s not a YouTube link');
            }
        }
    };
    commands['~sp'] = commands['~spotify'].bind(this);
    commands['~sp'].regex = [/^sp (.*)/, 2];
    commands['~spotify'].regex = [/^spotify (.*)/, 2];
    this.commands = commands;

};

exports.fetch = function(dbot) {
    return new spotify(dbot);
};
