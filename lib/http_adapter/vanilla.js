'use strict';

/**
 * Vanilla JS adapter for the browser.
 * No framework dependencies, but requires Promises (ES6 or Bluebird)
 */
var VanillaAdapter = function(XMLHttpRequest, Promise) {
    this.XMLHttpRequest = XMLHttpRequest;
    this.Promise = Promise;
    this._timeout = 30000;
    this._headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    };
};

VanillaAdapter.prototype.setTimeout = function(timeout) {
    this._timeout = timeout;
    return this;
};

VanillaAdapter.prototype.setHeader = function(key, value) {
    this._headers[key] = value;
    return this;
};

VanillaAdapter.prototype.setHeaders = function(headers) {
    for (var key in headers) {
        if (!headers.hasOwnProperty(key)) {
            continue;
        }
        this.setHeader(key, headers[key]);
    }
    return this;
};

VanillaAdapter.prototype.request = function(method, path, options, customHeaders) {
    var upperCaseMethod = method.toUpperCase();
    if ('GET' === upperCaseMethod) {
        path += (-1 === path.indexOf('?') ? '?' : '&');
        path += '_' + (new Date()).getTime();
    }

    var collectedHeaderSources = shallowMerge({}, this._headers, customHeaders);

    var headerPromises = [];
    var headerKeys = [];

    for (var i in collectedHeaderSources) {
        if (!collectedHeaderSources.hasOwnProperty(i)) continue;

        if (typeof collectedHeaderSources[i] === 'function') {
            headerPromises.push(collectedHeaderSources[i]());
            headerKeys.push(i);
            continue;
        }

        headerPromises.push(collectedHeaderSources[i]);
        headerKeys.push(i);
    }

    return Promise.all(headerPromises)
    .then(function(headers) {
        return new this.Promise(function(resolve, reject) {
            var xhr = new this.XMLHttpRequest();
            xhr.open(upperCaseMethod, path, true);
            headerKeys.forEach(function(headerKey, i) {
                xhr.setRequestHeader(headerKey, headers[i]);
            });
            xhr.timeout = this._timeout;
            xhr.onreadystatechange = function () {
                if (xhr.readyState != 4) return;

                try {
                    var body = JSON.parse(xhr.responseText);
                } catch (e) {
                    reject(e);
                }
                resolve(body);
            };
            var body = (options && options.body ? JSON.stringify(options.body) : undefined);
            xhr.send(body);
        }.bind(this));
    }.bind(this));
};

var shallowMerge = function(/* args */) {
    var destination = arguments[0];

    for (var i = 1, len = arguments.length; i < len; i++) {
        var source = arguments[i];
        for (var prop in source) {
            if (!source.hasOwnProperty(prop)) {
                continue;
            }
            destination[prop] = source[prop];
        }
    }

    return destination;
};

module.exports = VanillaAdapter;
