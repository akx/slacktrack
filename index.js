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
    console.log("Archive path <" + archivePath + "> created.");
}

var slack = new Slack(token);

function getSaver(userMap, groupOrChannel) {
    return function saver(resp) {
        if (!resp.messages.length) return;
        var mId = Math.ceil(parseFloat(resp.messages[0].ts));
        var thingName = (groupOrChannel.is_channel ? "c" : "g") + "-" + groupOrChannel.name;
        var dirname = path.join(archivePath, thingName, moment().format("YYYY-MM"));
        var filename = path.join(dirname, thingName + "." + mId + ".json");
        if (fs.existsSync(filename)) return; // Nothing new to write, don't bother
        resp.groupOrChannel = groupOrChannel;
        resp.userMap = userMap;
        mkdirp.sync(dirname);
        fs.writeFile(filename, JSON.stringify(resp), "UTF-8", function (err) {
            if (err) {
                console.error("Error saving:", filename);
            } else {
                console.log("OK:", filename);
            }
        });
    };
}

function archive(userMap, groupOrChannel) {
    var api = null;
    if (groupOrChannel.is_channel) {
        api = "channels.history";
    } else if (groupOrChannel.is_group) {
        api = "groups.history";
    }
    if (!api) {
        console.log("Don't know how to archive:", groupOrChannel);
    }
    slack.call(api, {
        channel: groupOrChannel.id,
        oldest: moment().subtract(minutes, "minute").unix(),
        count: 1000
    }).then(getSaver(userMap, groupOrChannel));
}

slack.call("users.list").then(function (data) {
    var userMap = {};
    data.members.forEach(function (user) {
        userMap[user.id] = user;
    });
    var archiveWithUserMap = _.partial(archive, userMap);

    slack.call("groups.list").then(function (data) {
        data.groups.forEach(archiveWithUserMap);
    });

    slack.call("channels.list").then(function (data) {
        _(data.channels).filter("is_member").reject("is_archived").forEach(archiveWithUserMap).value();
    });

});
