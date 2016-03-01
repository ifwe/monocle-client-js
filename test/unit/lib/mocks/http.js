var Promise = require('bluebird');

var HttpMock = function() {
    this._mocks = [];
    this._mockAny = false;
};

HttpMock.prototype.request = function(method, path, options, headers) {
    var optionsJson = JSON.stringify(options || {});
    var headersJson = JSON.stringify(headers || {});
    var pathBase = path.replace(/\?.*/g, '');

    // Resolve if preconfigured
    for (var i = 0, len = this._mocks.length, mock; i < len; i++) {
        mock = this._mocks[i];

        var isMatch = (
            method === mock.method
            && pathBase === mock.path
            && optionsJson === mock.optionsJson
            && headersJson === mock.headersJson
        );

        if (isMatch) {
            return mock.promise;
        }
    }

    if (this._mockAny) {
        return Promise.resolve(this._mockAny);
    }

    return Promise.reject("Unexpected HTTP " + method + " request for path " + path + " with options " + optionsJson + " and headers " + headersJson);
};

HttpMock.prototype.mock = function(method, path, options, headers) {
    var _resolve, _reject;
    method = method.toUpperCase();

    promise = new Promise(function(resolve, reject) {
        _resolve = resolve;
        _reject = reject;
    });

    var mock = {
        method: method,
        path: path,
        options: options || {},
        optionsJson: JSON.stringify(options || {}),
        headers: headers || {},
        headersJson: JSON.stringify(headers || {}),
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

HttpMock.prototype.mockAny = function(withResult) {
    this._mockAny = withResult;
};

module.exports = HttpMock;
