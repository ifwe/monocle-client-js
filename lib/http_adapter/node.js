'use strict';

var Promise = require('bluebird');
var DEFAULT_TIMEOUT = 30000;

function NodeAdapter(request) {
    this._timeout = DEFAULT_TIMEOUT;
    this._headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    };
    this._request = request || require('request-promise');
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
        return this._request({
            method: method.toUpperCase(),
            uri: path,
            // body: body || {},
            timeout: this._timeout,
            headers: headers,
            body: (options && options.body ? JSON.stringify(options.body) : undefined)
        });
    }.bind(this))
    .then(function(data) {
        return JSON.parse(data);
    })
    .catch(function(error) {
        if (error.name == 'RequestError' && error.message && error.message.match('Invalid URI')) {
            return Promise.reject({
                code: 404, // malformed request
                message: 'Invalid URI sent',
                error: "NOT FOUND"
            });
        }

        if (error.error) {
            return Promise.reject(JSON.parse(error.error));
        }
        //Unknown use case. This use case should never happen but adding it just in case
        return Promise.reject(error);
    })
};

module.exports = NodeAdapter;
