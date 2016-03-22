/**
 * Module name: Wikipedia
 */

var _ = require('underscore')._,
   request = require('request');

var wikipedia = function(dbot) {

  this.api = {
    'randomSentence': function(term, cb) {
      request.get('https://en.wikipedia.org/w/api.php', {
        'qs': {
          'action': 'opensearch',
          'search': term
        },
        'json': true
      }, function(error, response, body) {
        if(body && body[1].length != 0) {
          request.get('https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&&titles='+body[1][0], {'json': true}, function(error, response, body) {
            body = body.query.pages
            for(var prop in body) {
              break;
            }

            body = body[prop].revisions[0]['*'];
            var oBody = body;
            console.log(body);

            var redirect = body.match(/#redirect \[\[(.+)\]\]/i);
            if(redirect) {
              return this.api.randomSentence(redirect[1], cb);
            }

            var refer = body.match(/may refer to:/i);
            if(refer) {
              var links = body.match(/\[\[(.+)\]\]/g);
              return this.api.randomSentence(links[_.random(0,links.length-1)], cb);
            }

            body = body.replace(/=(.+)=/g,'');
            body = body.replace(/\t/g,'');
            body = body.replace(/\{(.+)\}/g,'');
            body = body.replace(/(\[|\])/g,'');
            body = body.replace(/(\(|\))/g,'');
            body = body.replace(/\*\s?/g,'');
            body = body.replace(/<.+?>/g,'');

            body = body.split('\n');

            body = _.filter(body, function(line) {
              var spaces = line.match(/\s/g);
              return line != '' && !line.match(/{|}/) && !line.match(/'''/) && !line.match(/^\s+$/) && !line.match(/^!/) && !line.match(/^Category:/) && !line.match(/http:\/\//) && !line.match(/\|/) && !line.match(/:$/) && spaces && spaces.length > 10 && spaces.length < 60;
            });

            var sentence = body[_.random(0, body.length -1)];

            if(_.isUndefined(sentence)) {
              var links = oBody.match(/\[\[(.+)\]\]/g);
              return this.api.randomSentence(links[_.random(0,links.length-1)], cb);
            }

            cb(sentence);
          }.bind(this));
        }
      }.bind(this));
    }
  };

  this.commands = {
    '~lol': function(event) {
      this.api.randomSentence(event.input[1], function(sentence) {
        event.reply(sentence);
      });
    },

    '~w': function(event) {
	  request.get('http://wikipedia.org/w/api.php', {
		'qs': {
		  'action': 'opensearch',
		  'search': event.input[1].replace(/\s/,'_'),
		  'limit': 1,
		  'namespace': 0,
		  'format': 'json'
		},
		'json': true
	  }, function(err, res, body) {
		if(!err && body[1].length !== 0) {
		  event.reply(event.input[1] + ': https://wikipedia.org/wiki/'+body[1][0].replace(/\s/g, '_'));
		} else {
		  event.reply(event.input[1] + ' not found.');
		}
	  });
    }
  };
  this.commands['~lol'].regex = [/^lol ([\d\w\s-]*)/, 2];
  this.commands['~w'].regex = [/^w (.+)/, 2];

};

exports.fetch = function(dbot) {
    return new wikipedia(dbot);
};
