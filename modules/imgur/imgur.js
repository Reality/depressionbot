/**
 * Module Name: imgur
 * Description: Various imgur functionality
 */

var _ = require('underscore')._,
    request = require('request'),
    crypto = require('crypto');

var imgur = function(dbot) {
    this.internalAPI = {
        'infoString': function(imgData) {
            info = '';
            if(imgData && _.has(imgData, 'data') && !_.isUndefined(imgData.data.type)) {
                imgData = imgData.data;
                if(imgData.title) {
                    info += imgData.title + ' - ';
                }
                if(imgData.type) {
                    if(imgData.animated) {
                        info += 'an animated ' + imgData.type.split('/')[1] + ' with ';
                    } else {
                        info += 'a ' + imgData.type.split('/')[1] + ' with ';
                    }
                } else {
                    info += 'an image with ';
                }
                info += imgData.views + ' views (';
                info += imgData.width + 'x' + imgData.height + ')';
            }

            return info;
        }.bind(this),

        'albumInfoString': function(albumData) {
            var info = '';
            if(albumData && _.has(albumData, 'data') && !_.isUndefined(albumData.data.id)) {
                albumData = albumData.data;
                if(albumData.title) {
                    info += albumData.title + ' - ';
                }
                if(albumData.description) {
                    info += albumData.description + ' is ';
                }
                info += 'an album with ' + albumData.images_count + ' images ';
                info += 'and ' + albumData.views + ' views';
                if(albumData.nsfw) {
                    info += ' - NSFW';
                }
            }
            return info;
        }.bind(this),

        'galleryInfoString': function(galData) {
            var info = '';
            if(galData && _.has(galData, 'data') && !_.isUndefined(galData.data.is_album)) {
                if(galData.data.is_album === true) {
                    info = this.internalAPI.albumInfoString(galData);
                } else {
                    info = this.internalAPI.infoString(galData);
                }
            }
            return info;
        }.bind(this)
    };

    this.api = { 
        'getRandomImage': function(callback) {
            var random = function(len) {
                var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
                return len ? chars.charAt(~~(Math.random()*chars.length)) + random(len-1) : "";
            };
            
            var ext = [ 'gif', 'png', 'jpg' ];
            var testSlug = random(5);
            var testUrl = 'http://i.imgur.com/' + 
                testSlug +
                '.' + ext[_.random(0, ext.length - 1)];
            dbot.db.imgur.totalHttpRequests += 1;
            var image = request(testUrl, function(error, response, body) {
                // 492 is body.length of a removed image
                if(!error && response.statusCode == 200 && body.length != 492) {
                    dbot.db.imgur.totalImages += 1;
                    var hash = crypto.createHash('md5').update(body).digest("hex");
                    if(_.has(dbot.modules, 'quotes')){
                        // autoadd: {"abcdef": "facebookman"}
                        if(_.has(dbot.config.modules.imgur.autoadd,hash)){
                            var category = dbot.config.imgur.autoadd[hash];
                            if (_.contains(category, testUrl)){
                                // there's probably less than 62^5 chance of this happening
                            } else {
                                dbot.api.quotes.addQuote(category, testUrl,
                                    dbot.config.name, function() { });
                            }
                        }
                    }
                    callback(testUrl, testSlug,hash);
                } else {
                    this.api.getRandomImage(callback);
                }
            }.bind(this)); 
        },

        'getImageInfoString': function(slug, callback) {
            this.api.getImageInfo(slug, function(imgData) {
                callback(this.internalAPI.infoString(imgData));
            }.bind(this));
        },

        'getImageInfo': function(slug, callback) {
            request.get({
                'url': 'https://api.imgur.com/3/image/' + slug + '.json',
                'json': true,
                'headers': {
                    'Authorization': 'Client-ID ' + this.config.apikey
                }
            }, function(err, response, body) {
                dbot.db.imgur.totalApiRequests += 1;
                callback(body);
            }.bind(this));
        },

        'getAlbumInfo': function(slug, callback) {
            request.get({
                'url': 'https://api.imgur.com/3/album/' + slug + '.json',
                'json': true,
                'headers': {
                    'Authorization': 'Client-ID ' + this.config.apikey
                }
            }, function(err, response, body) {
                this.db.totalApiRequests += 1;
                callback(body);
            }.bind(this));
        },

        'getGalleryInfo': function(slug, callback) {
            request.get({
                'url': 'https://api.imgur.com/3/gallery/' + slug + '.json',
                'json': true,
                'headers': {
                    'Authorization': 'Client-ID ' + this.config.apikey
                }
            }, function(err, response, body) {
                this.db.totalApiRequests += 1;
                callback(body);
            }.bind(this));
        }
    };
    this.api['getRandomImage'].external = true;
    this.api['getRandomImage'].extMap = [ 'callback' ];
    this.api['getImageInfoString'].external = true;
    this.api['getImageInfoString'].extMap = [ 'slug', 'callback' ];

    this.commands = {
        '~ri': function(event) {
            this.api.getRandomImage(function(link, slug) {
                this.api.getImageInfo(slug, function(imgData) {
                    var info = this.internalAPI.infoString(imgData);
                    event.reply(event.user + ': ' + link + ' [' + info + ']');
                }.bind(this));
            }.bind(this));
        }
    }

    this.onLoad = function() {
        var imgurHandler = function(event, matches, name) {
            if(matches[1]) {
                var dataCallback = function(data) {
                    var info;
                    if(name == 'imgurimage') { 
                        info = this.internalAPI.infoString(data);
                    } else if(name == 'imguralbum') {
                        info = this.internalAPI.albumInfoString(data);
                    } else if(name == 'imgurgallery') {
                        info = this.internalAPI.galleryInfoString(data);
                    }

                    if(info) event.reply(dbot.t('imgurinfo', { 'info': info }));
                }.bind(this);

                if(name == 'imgurimage') { 
                    this.api.getImageInfo(matches[1], dataCallback);
                } else if(name == 'imguralbum') {
                    this.api.getAlbumInfo(matches[1], dataCallback);
                } else if(name == 'imgurgallery') {
                    this.api.getGalleryInfo(matches[1], dataCallback);
                }
            }
        }.bind(this);

        dbot.api.link.addHandler('imguralbum', /https?:\/\/imgur\.com\/a\/([a-zA-Z0-9]+)/, imgurHandler);
        dbot.api.link.addHandler('imgurgallery', /https?:\/\/imgur\.com\/gallery\/([a-zA-Z0-9]+)/, imgurHandler);
        dbot.api.link.addHandler('imgurimage', /https?:\/\/i\.imgur\.com\/([a-zA-Z0-9]+)\.([jpg|png|gif])/, imgurHandler);
        dbot.api.link.addHandler('imgurimage', /https?:\/\/imgur\.com\/([a-zA-Z0-9]+)/, imgurHandler);

        if(!_.has(dbot.db.imgur, 'totalHttpRequests')) dbot.db.imgur.totalHttpRequests = 0; 
        if(!_.has(dbot.db.imgur, 'totalApiRequests')) dbot.db.imgur.totalApiRequests = 0;
        if(!_.has(dbot.db.imgur, 'totalImages')) dbot.db.imgur.totalImages = 0;
        this.db = dbot.db.imgur;
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new imgur(dbot);
}
