var Promise = require('bluebird');

var HttpMock = function() {
    this._mocks = [];
};

HttpMock.prototype.request = function(method, path, options) {
    var optionsJson = JSON.stringify(options);
    var pathBase = path.replace(/\?.*/g, '');

    // Resolve if preconfigured
    for (var i = 0, len = this._mocks.length; i < len; i++) {
        var mock = this._mocks[i];

        var isMatch = (
            method === mock.method
            && pathBase === mock.path
            && optionsJson === mock.optionsJson
        );

        if (isMatch) {
            return mock.promise;
        }
    }

    return Promise.reject("Unexpected HTTP " + method + " request for path " + path + " with options " + optionsJson);
};

HttpMock.prototype.mock = function(method, path, options) {
    var _resolve, _reject;
    method = method.toUpperCase();

    promise = new Promise(function(resolve, reject) {
        _resolve = resolve;
        _reject = reject;
    });

    var mock = {
        method: method,
        path: path,
        options: options,
        optionsJson: JSON.stringify(options),
        resolvesWith: _resolve,
        rejectsWith: _reject,
        resolvesWithDelay: function(delay, data) {
            setTimeout(function() {
                _resolve(data)
            }, delay);
        },
        promise: promise
    };

    this._mocks.push(mock);

    return mock;
};

module.exports = HttpMock;
