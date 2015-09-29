var Promise = require('bluebird');

var DEFAULT_TIMEOUT = 30000;

var Http = function(request) {
    this._request = request || require('request');
    Promise.promisifyAll(this._request);
    this._timeout = DEFAULT_TIMEOUT;
};

Http.prototype.setTimeout = function(timeout) {
    this._timeout = parseInt(timeout, 10) || DEFAULT_TIMEOUT;
};

Http.prototype.request = function(method, path, options) {
    var headers = {
        // Cookie: req.cookies || {},
        // 'x-tagged-client-id': req.clientId,
        // 'x-tagged-client-secret': req.secret,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    };

    if (method === 'delete') {
        method = 'del';
    }

    var url = path;
    // var query = {};
    // if (options.hasOwnProperty('params')) {
    //     var
    // }

    var method = method.toLowerCase() + 'Async';

    return this._request[method]({
        url: url,
        // body: req.body,
        timeout: this._timeout,
        headers: headers
    }).then(extractRequest);
};

// `Promise.promisifyAll` will resolve callbacks using an `array`
// if the callback is called with more than 2 arguments.
// e.g. `null, 'something', 'something else'`
// would end up resolving the promise with
// `['something', 'something else']`
// Since `this._request.post` calls the callback with 3 arguments
// e.g. `null, response, body`
// then we must extract the response from the data
// to satisfy the expectations of the adapter.
var extractRequest = function(data) {
    return data[0];
};

module.exports = Http;
