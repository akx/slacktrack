var Slack = require("./slack");
var _ = require("lodash");
var moment = require("moment");
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");

var archivePath = path.resolve(process.env.ARCHIVE_PATH || "./archive");
var token = process.env.SLACK_TOKEN;
var minutes = (0 | process.env.MINUTES) || 30;

if (!token) {
    console.error("Missing SLACK_TOKEN.");
    process.exit(1);
}

if (!fs.existsSync(archivePath)) {
    fs.mkdirSync(archivePath);
    console.log("Archive path created.");
}

var slack = new Slack(token);

function saver(thing) {
    return function (resp) {
        if (!resp.messages.length) return;
        var mId = Math.ceil(parseFloat(resp.messages[0].ts));
        var thingName = (thing.is_channel ? "c" : "g") + "-" + thing.name;
        var dirname = path.join(archivePath, thingName, moment().format("YYYY-MM"));
        var filename = path.join(dirname, thingName + "." + mId + ".json");
        if (fs.existsSync(filename)) return; // Nothing new to write, don't bother
        resp.thing = thing;
        mkdirp.sync(dirname);
        fs.writeFile(filename, JSON.stringify(resp), "UTF-8", function (err) {
            if (err) console.error("Error saving:", filename);else console.log("OK:", filename);
        });
    };
}

function archive(thing) {
    var api = null;
    if (thing.is_channel) {
        api = "channels.history";
    } else if (thing.is_group) {
        api = "groups.history";
    }
    if (!api) {
        console.log("Don't know how to archive:", thing);
    }
    slack.call(api, {
        channel: thing.id,
        oldest: moment().subtract(minutes, "minute").unix(),
        count: 1000
    }).then(saver(thing));
}

slack.call("groups.list").then(function (data) {
    _(data.groups).forEach(archive).value();
});

slack.call("channels.list").then(function (data) {
    _(data.channels).filter("is_member").reject("is_archived").forEach(archive).value();
});

