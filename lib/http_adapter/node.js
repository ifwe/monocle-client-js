'use strict';

var Promise = require('bluebird');
var DEFAULT_TIMEOUT = 30000;

function NodeAdapter(request) {
    this._request = request || require('request');
    Promise.promisifyAll(this._request);
    this._timeout = DEFAULT_TIMEOUT;
    this._headers = {
        'Content-Type': 'application/json'
    };
};

NodeAdapter.prototype.setTimeout = function(timeout) {
    this._timeout = parseInt(timeout, 10) || DEFAULT_TIMEOUT;
};

NodeAdapter.prototype.setHeader = function(key, value) {
    this._headers[key] = value;
};

NodeAdapter.prototype.setHeaders = function(headers) {
    for (var i in headers) {
        if (!headers.hasOwnProperty(i)) continue;
        this.setHeader(i, headers[i]);
    }
};

NodeAdapter.prototype.request = function(method, path, options) {
    if (method === 'delete') {
        method = 'del';
    }

    var method = method.toLowerCase() + 'Async';
    var headers = {};

    for (var i in this._headers) {
        if (!this._headers.hasOwnProperty(i)) continue;
        if (typeof this._headers[i] === 'function') {
            headers[i] = this._headers[i]();
            continue;
        }

        headers[i] = this._headers[i];
    }

    return Promise.props(headers)
    .then(function(headers) {
        return this._request[method]({
            url: path,
            // body: req.body,
            timeout: this._timeout,
            headers: headers
        }).then(extractRequest);
    }.bind(this));
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

module.exports = NodeAdapter;
