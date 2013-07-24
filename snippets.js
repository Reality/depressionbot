/*** String ***/ 

String.prototype.valMatch = function(regex, expLength) {
    var key = this.match(regex);
    if(key !== null && key.length == expLength) {
        return key;
    } else {
        return false;
    }
};

String.prototype.format = function() { // format takes either multiple indexed arguments, or a single object, whose keys/values will be used
    var targetStr = this;
    var replacements = [].splice.call(arguments, 0);
    if ((replacements.length === 1) && (typeof(replacements[0]) === 'object')) { // if we were passed a single object rather than multiple args
        replacements = replacements[0]; // use the object as source of replacements
    };
    for (key in replacements) {
        if (replacements.hasOwnProperty(key)) {
            var replacePattern = new RegExp("\\{"+key+"\\}", "g");
            targetStr = targetStr.replace(replacePattern, replacements[key]);
        };
    };
    return targetStr;
};

/*** Regex ***/
RegExp.prototype.url_regex = function() {
    var reg = new RegExp(
       "^" +
       // protocol identifier
       "(?:(?:https?|ftp)://)" +
       // user:pass authentication
       "(?:\\S+(?::\\S*)?@)?" +
       "(?:" +
       // IP address exclusion
       // private & local networks
       "(?!10(?:\\.\\d{1,3}){3})" +
       "(?!127(?:\\.\\d{1,3}){3})" +
       "(?!169\\.254(?:\\.\\d{1,3}){2})" +
       "(?!192\\.168(?:\\.\\d{1,3}){2})" +
       "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
       // IP address dotted notation octets
       // excludes loopback network 0.0.0.0
       // excludes reserved space >= 224.0.0.0
       // excludes network & broacast addresses
       // (first & last IP address of each class)
       "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
       "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
       "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
       "|" +
       // host name
       "(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)" +
       // domain name
       "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*" +
       // TLD identifier
       "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
       ")" +
       // port number
       "(?::\\d{2,5})?" +
       // resource path
        "(?:/[^\\s]*)?" +
        "$", "i"
    );
    return reg;
}

Number.prototype.numberFormat = function(dec_places){
    //TODO Possibly abstract this to some sort of localisation module in future?
    var dec_point = '.';
    var sep = ',';

    var parts = this.toFixed(dec_places).toString().split(dec_point);
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    return parts.join(dec_point);
}

// http://simonwillison.net/2006/Jan/20/escape/#p-6
String.prototype.escape = function() {
    return this.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
