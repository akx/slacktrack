var querystring = require("querystring");
var https = require("https");
var Promise = require("bluebird");
var debug = require("debug")("slack");
var Timeout = require("./timeout");

function Slack(token, host) {
    this.token = token;
    this.host = host || "api.slack.com";
}

Slack.prototype.call = function call(method, params) {
    params = params || {};
    var self = this;
    return new Promise(function (resolve, reject) {
        params.token = self.token;
        var post_data = querystring.stringify(params);
        var req = https.request({
            hostname: self.host,
            method: "POST",
            path: "/api/" + method,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": post_data.length
            }
        });
        var callDesc = method + "(" + post_data.replace(/token=[a-z0-9-]+/ig, 'token=*') + ")";
        var timeout = new Timeout("Slack timeout: " + callDesc, 5000);
        req.on("response", function (res) {
            var buffer = "";
            res.on("data", function (chunk) {
                timeout.start();
                return buffer += chunk;
            });
            res.on("end", function () {
                timeout.stop();
                var value;
                if (res.statusCode === 200) {
                    return resolve(JSON.parse(buffer));
                }
                return reject({
                    "ok": false,
                    "error": "API response: " + res.statusCode
                });
            });
        });
        req.on("error", function (error) {
            timeout.stop();
            reject({"ok": false, "error": error});
        });
        req.write("" + post_data);
        req.end();
        debug("requesting: " + callDesc);
    });
};

module.exports = Slack;
