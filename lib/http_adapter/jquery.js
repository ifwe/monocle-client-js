'use strict';

function jQueryAdapter(jQuery, Promise) {
    this._$ = jQuery;
    this._Promise = Promise;
    this._timeout = 30000;
    this._headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    };
}

jQueryAdapter.prototype.setTimeout = function(timeout) {
    this._timeout = parseInt(timeout, 10) || 30000;
    return this;
};

jQueryAdapter.prototype.setHeader = function(key, value) {
    this._headers[key] = value;
};

jQueryAdapter.prototype.setHeaders = function(headers) {
    for (var i in headers) {
        if (!headers.hasOwnProperty(i)) continue;
        this.setHeader(i, headers[i]);
    }
};

jQueryAdapter.prototype.request = function(method, path, options, customHeaders) {
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

    return this._Promise.all(headerPromises)
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

        var xhr = this._$.ajax({
            method: upperCaseMethod,
            url: path,
            timeout: this._timeout,
            headers: headers,
            data: (options && options.body)
        });

        return this._Promise.resolve(xhr)
        .catch(function(error) {
            // 304 is a special case of errors that can be handled by the client library
            if (error.status === 304) {
                return this._Promise.reject({
                    $httpStatus: 304
                });
            }

            // Everything else, forward the error along
            return this._Promise.reject(error.responseJSON);
        }.bind(this));
    }.bind(this));
};

module.exports = jQueryAdapter;
