'use strict';

var Store = require('./cache/store');
var MemoryBackend = require('./cache/memory');

function Monocle(http) {
    this._http = http;
    this._base = '/';
    this._cache = new Store(new MemoryBackend('monocle', { capacity: 100 }));
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
        switch (method) {
            // Check cache if attempting to get resource
            case 'get':
                var cached = this._cache.get(path);
                if (cached) {
                    if (!options.props) {
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

        var fullPath = buildFullPath(this._base, path);
        var query = buildQuery(options);

        if (query) fullPath += '?' + query;

        return this._http.request(method.toUpperCase(), fullPath, options)
        .then(cacheResource.bind(this, method));
    };

    var cacheResource = function(method, resource) {
        if ('get' === method && resource.$id && resource.$expires) {
            this._cache.put(resource.$id, resource, resource.$expires);
        }
        return resource;
    };

    var buildFullPath = function(base, path) {
        return (base + path).replace(/\/{2,}/g, '/');
    };

    function buildQuery(options) {
        var query = {};

        if (options && Array.isArray(options.props)) query.props = options.props.join(',');

        var queryStringParts = [];

        for (var i in query) {
            queryStringParts.push(encodeURIComponent(i) + '=' + encodeURIComponent(query[i]));
        }

        return queryStringParts.join('&');
    };
});

module.exports = Monocle;
