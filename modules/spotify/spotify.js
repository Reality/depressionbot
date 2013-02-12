var request = require('request'),
  _ = require('underscore')._;

var spotify = function(dbot) {
  /* examples:
   * http://open.spotify.com/track/42SYMWISn7xUpTNPLw9V5E
   * spotify:track:42SYMWISn7xUpTNPLw9V5E
   * http://open.spotify.com/artist/3yY2gUcIsjMr8hjo51PoJ8
   * spotify:artist:3yY2gUcIsjMr8hjo51PoJ8
   * http://open.spotify.com/album/30g571JKoxs8AnsgAViV2J
   * spotify:album:30g571JKoxs8AnsgAViV2J
   */
  this.spotifyRegex = /(\b(https?:\/\/open.spotify.com\/(artist|track|album)\/\w*|spotify:(artist|track|album):\w*)\b)/ig;
  this.spotifyLookup = 'http://ws.spotify.com/lookup/1/.json';
  this.spotifySearch = 'http://ws.spotify.com/search/1/track.json';

  this.lookup = function(event, link) {
    request({
      url: this.spotifyLookup,
      qs: {uri: link},
      json: true
    }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var spotify = "\u00039spotify\u000f";
        if (_.has(body, 'track')) {
          event.reply(dbot.t("track", {s: spotify, artist: _.map(body.track.artists, function(a) { return a.name }).join(', '), album: body.track.album.name, track: body.track.name}));
        }
        else if (_.has(body, 'album')) {
          event.reply(dbot.t("album", {s: spotify, artist: body.album.artist, album: body.album.name}));
        }
        else if (_.has(body, 'artist')) {
          event.reply(dbot.t("artist", {s: spotify, artist: body.artist.name}));
        }
      }
    });
  };

  var commands = {
    '~spotify': function(event) {
      var query = event.input[1];
      request({
        url: this.spotifySearch,
        qs: {q: query},
        json: true
      }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          if (_.has(body, 'tracks') && body.tracks[0] && _.has(body.tracks[0], 'href')) {
            var t = body.tracks[0].href;
            t = t.replace(/:/g, '/');
            t = t.replace(/spotify/, 'http://open.spotify.com');
            event.reply(t);
          } else {
            event.reply(dbot.t("not-found", {s: "\u00039spotify\u000f"}));
          }
        }
      });  
    }
  };
  commands['~spotify'].regex = [/^~spotify (.*)/, 2];
  this.listener = function(event) {
    var spotifyMatches = event.message.match(this.spotifyRegex);
    if (spotifyMatches != null) {
      this.lookup(event, spotifyMatches[0]);
    }
  }.bind(this);
  this.on = 'PRIVMSG';
  this.commands = commands;
};

exports.fetch = function(dbot) {
  return new spotify(dbot);
};
