var exec = require('child_process').exec,
    request = require('request');

var pages = function(dbot) {
    var depression = dbot.db.quoteArrs[dbot.config.project.quotecat];

    var rev;
    exec("git rev-list --all | wc -l", function(a,b,c){rev = b});
    var diff;
    exec("git log -1", function(a, b, c){diff = b});
    
    /* TODO: merge back into github module */
    var milestones;
    request("https://api.github.com/repos/" + dbot.config.github.defaultrepo + "/milestones?state=open", function(e, r, b){
        milestones = JSON.parse(b);
    });


    return {
        '/project': function(req, res) {
            res.render('project', {
                "name": dbot.config.name,
                "intro": dbot.t("dbotintro", {
                    "botname": dbot.config.name
                }),
                "curr839": dbot.config.language,
                "currver": dbot.config.version,
                "currlang": dbot.t("dbotspeaks",{
                    "lang839": dbot.config.language,
                    "langen": dbot.strings[dbot.config.language]["en"],
                    "lang": dbot.t(dbot.config.language),
                    "name": dbot.config.name
                }),
                "projectstatus": dbot.t("projectstatus"),
                "revnum": dbot.t("revnum",{
                    "name": dbot.config.name,
                    "rev": rev,
                    "ver": "abcdef" // TODO, obviously
                }),
                "modules": dbot.config.moduleNames,
                "loadmod": dbot.t("loadedmodules"),
                "debugmode": dbot.t("debugmode-" + dbot.config.debugMode),
                "milestones": milestones,
                "milestoneprog": dbot.t("milestoneprog"),
                "config": dbot.t("configoptions"),
                "milestonename": dbot.t("milestonename"),
                "openmilestone": dbot.t("openmilestone"),
                "closedmilestone": dbot.t("closedmilestone"),
                "development": dbot.t("development"),
                "dquote": depression[Math.floor(Math.random()*depression.length)],
                "diff": diff,
                "pagetitle": dbot.t("pagetitle", {
                    "botname": dbot.config.name
                })
           });
        },
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
