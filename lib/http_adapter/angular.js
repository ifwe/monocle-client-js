'use strict';

function AngularAdapter($http, $q) {
    this._$http = $http;
    this._$q = $q;
    this._timeout = 30000;
    this._headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    };
}

AngularAdapter.prototype.setTimeout = function(timeout) {
    this._timeout = parseInt(timeout, 10) || 30000;
    return this;
};

AngularAdapter.prototype.setHeader = function(key, value) {
    this._headers[key] = value;
};

AngularAdapter.prototype.setHeaders = function(headers) {
    for (var i in headers) {
        if (!headers.hasOwnProperty(i)) continue;
        this.setHeader(i, headers[i]);
    }
};

AngularAdapter.prototype.request = function(method, path, options, customHeaders) {
    var headerPromises = [];
    var headerKeys = [];

    for (var i in this._headers) {
        if (!this._headers.hasOwnProperty(i)) continue;

        if (typeof this._headers[i] === 'function') {
            headerPromises.push(this._headers[i]());
            headerKeys.push(i);
            continue;
        }

        headerPromises.push(this._headers[i]);
        headerKeys.push(i);
    }

    return this._$q.all(headerPromises)
    .then(function(results) {
        var headers = customHeaders || {};

        for (var i = 0, len = results.length; i < len; i++) {
            if (headers.hasOwnProperty(headerKeys[i])) {
                // This header is already set by custom headers, skip
                continue;
            }
            headers[headerKeys[i]] = results[i];
        }

        // Add cache buster to GETs -- we manage the cache ourselves.
        var upperCaseMethod = method.toUpperCase();
        if (upperCaseMethod === 'GET') {
            path += (-1 === path.indexOf('?') ? '?' : '&');
            path += '_' + (new Date()).getTime();
        }

        return this._$http({
            method: upperCaseMethod,
            url: path,
            timeout: this._timeout,
            headers: headers,
            data: (options && options.body)
        })
        .catch(function(response) {
            // 304 is a special case of errors that can be handled by the client library
            if (response.status === 304) {
                return this._$q.reject({
                    $httpStatus: 304
                });
            }

            // Everything else, forward the error along
            return this._$q.reject(response.data);
        }.bind(this))
        .then(function(response) {
            return response.data;
        });
    }.bind(this));
};

module.exports = AngularAdapter;
