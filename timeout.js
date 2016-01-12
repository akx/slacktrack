
function Timeout(message, time) {
    this.message = message;
    this.time = time;
    this._timer = null;
}

Timeout.prototype.start = function () {
    this.stop();
    this._timer = setTimeout(this.signal.bind(this), this.time);
};

Timeout.prototype.stop = function () {
    if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
    }
};

Timeout.prototype.signal = function () {
    this.stop();
    throw new Error(this._timer);
};

module.exports = Timeout;
