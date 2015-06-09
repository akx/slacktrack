var querystring = require("querystring");
var https = require("https");
var Promise = require("bluebird");

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
        req.on("response", function (res) {
            var buffer = "";
            res.on("data", function (chunk) {
                return buffer += chunk;
            });
            res.on("end", function () {
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
            reject({"ok": false, "error": error});
        });
        req.write("" + post_data);
        req.end();
    });
};

module.exports = Slack;
