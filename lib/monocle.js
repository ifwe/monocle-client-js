'use strict';

var Store = require('./cache/store');
var ResourceCache = require('./cache/resource');
var querystring = require('querystring');

function Monocle(http) {
    this._http = http;
    this._base = '/';
    this._cache = new Store(new ResourceCache('monocle', { capacity: 100 }));
    this._batched = [];
    this._batchTimeout = null;
};

Monocle.prototype.setBase = function(base) {
    this._base = base;
    return this;
};

Monocle.prototype.getCache = function() {
    return this._cache;
};

['get', 'post', 'put', 'patch', 'delete', 'options'].forEach(function(method) {
    Monocle.prototype[method] = function(path, options) {
        return _handle.call(this, method, path, options);
    };
});

var updateBatchTimeout = function() {
    if (null !== this._batchTimeout) {
        // Batch timeout already set up, nothing to do.
        return;
    }

    this._batchTimeout = setTimeout(function() {
        processBatch.call(this);
        this._batchTimeout = null;
    }.bind(this));
};

var processBatch = function() {
    var batched = this._batched;
    this._batched = [];

    if (1 === batched.length) {
        // Do not use the batch endpoint if there is only one API call to be made.
        var fullPath = buildFullPath(this._base, batched[0].url);
        var query = buildQuery(batched[0].options);

        if (query) fullPath += '?' + query;

        return this._http.request(batched[0].method.toUpperCase(), fullPath, batched[0].options)
        .then(batched[0].resolve)
        .catch(batched[0].reject);
    }

    return this._http.request('POST', buildFullPath(this._base, '/_batch'), {
        body: batched
    }).then(function(results) {
        results.forEach(function(result, i) {
            if (result.status >= 200 && result.status < 300) {
                batched[i].resolve(result.body);
            } else {
                batched[i].reject(result.body);
            }
        })
    }).catch(function(error) {
        batched.forEach(function(apiCall, i) {
            batched[i].reject(error);
        });
    });
};

var _handle = function(method, path, options) {
    switch (method) {
        // Check cache if attempting to get resource
        case 'get':
            var cached = this._cache.get(path);
            if (cached) {
                if (!options || !options.props) {
                    return Promise.resolve(cached);
                }
                var found = true;
                for (var i in options.props) {
                    if (!cached.hasOwnProperty(options.props[i])) {
                        this._cache.remove(path);
                        found = false;
                        break;
                    }
                }
                if (found) return Promise.resolve(cached);
            }
            break;

        // Remove from cache when resource is being updated or removed
        case 'post':
        case 'put':
        case 'delete':
        case 'patch':
            this._cache.remove(path);
            break;
    }

    return (new Promise(function(resolve, reject) {
        this._batched.push({
            method: method,
            url: path,
            options: options,
            resolve: resolve,
            reject: reject
        });
        updateBatchTimeout.call(this);
    }.bind(this))).then(cacheResource.bind(this, method));
};

var cacheResource = function(method, resource) {
    if ('get' === method) {
        this._cache.put(resource);
    }
    return resource;
};

var buildFullPath = function(base, path) {
    return (base + path).replace(/\/{2,}/g, '/');
};

function buildQuery(options) {
    var query = {};
    if (options && Array.isArray(options.props)) query.props = options.props.join(',');
    return querystring.stringify(query);
};

module.exports = Monocle;
