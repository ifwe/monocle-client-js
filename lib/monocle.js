'use strict';

var Store = require('./cache/store');
var ResourceCache = require('./cache/resource');
var querystring = require('querystring');
var CollectionCache = require('./cache/collection');

function Monocle(http) {
    this._http = http;
    this._base = '/';
    this._cache = new Store(new ResourceCache('monocle', { capacity: 100 }));
    this._batched = [];
    this._batchTimeout = null;
    this._queuedGets = {};
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

function handle304(batched, result) {
    if (result && 304 === result.$httpStatus) {
        batched.cached.$httpStatus = 304;
        return batched.cached;
    }

    return Promise.reject(result);
}

var processBatch = function() {
    var batched = this._batched;
    this._batched = [];

    if (1 === batched.length) {
        // Do not use the batch endpoint if there is only one API call to be made.
        var fullPath = buildFullPath(this._base, batched[0].url);

        return this._http.request(batched[0].method.toUpperCase(), fullPath, batched[0].options, batched[0].headers)
        .catch(handle304.bind(this, batched[0]))
        .then(batched[0].resolve)
        .catch(batched[0].reject);
    }

    var envelopes = batched.map(function(data) {
        return {
            method: data.method,
            url: data.url,
            headers: data.headers,
            options: data.options,
            resolve: data.resolve,
            reject: data.reject
        };
    });

    return this._http.request('POST', buildFullPath(this._base, '/_batch'), {
        body: envelopes
    }).then(function(results) {
        results.forEach(function(result, i) {
            if (result.status >= 200 && result.status < 300) {
                batched[i].resolve(result.body);
            } else if (result.status === 304) {
                batched[i].resolve(batched[i].cached);
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

var getQueuedGetKey = function(path, options) {
    return [path, JSON.stringify(options)].join(':');
};

var getQueuedGet = function(path, options) {
    var key = getQueuedGetKey(path, options);
    if (this._queuedGets.hasOwnProperty(key)) {
        return this._queuedGets[key];
    }
    return null;
};

var enqueueGet = function(path, options, promise) {
    var key = getQueuedGetKey(path, options);
    this._queuedGets[key] = promise;
};

var clearQueuedGet = function(path, options) {
    var key = getQueuedGetKey(path, options);
    delete this._queuedGets[key];
};

var _handle = function(method, path, options) {
    options = options || {};
    var headers = {};
    var cached = null;

    switch (method) {
        case 'get':
            // Check if this GET is already queued
            var queuedGet = getQueuedGet.call(this, path, options);
            if (queuedGet) return queuedGet;

            // Check cache if attempting to get resource
            cached = this._cache.get(path);
            if (cached && isResourceComplete(cached, options.props)) {
                // Collections need to validate etag with the server first
                if ('collection' === cached.$type) {
                    var collectionCache = new CollectionCache(cached, options.props, options.query);
                    var etag = collectionCache.id();
                    if (etag) {
                        headers['if-none-match'] = etag;
                    }
                    // We need to validate the etag with the server,
                    // so break early to allow an HTTP request to go through.
                    break;
                }
                return Promise.resolve(cached);
            }
            break;

        case 'post':
        case 'put':
        case 'delete':
        case 'patch':
            // Remove from cache when resource is being updated or removed
            this._cache.remove(path);
            break;
    }

    var promise = (new Promise(function(resolve, reject) {
        var query = buildQuery(options);

        if (query) {
            path += '?' + query;
        }

        this._batched.push({
            method: method,
            url: path,
            headers: headers,
            options: options,
            resolve: resolve,
            reject: reject,
            cached: cached
        });
        updateBatchTimeout.call(this);
    }.bind(this)))
    .then(cacheResource.bind(this, method))
    .finally(clearQueuedGet.bind(this, path, options));

    if (method === 'get') {
        enqueueGet.call(this, path, options, promise);
    }

    return promise;
};

/**
 * Returns true if the provided resource fullfills all of the requirements of the options.
 *
 * @param object resource - The resource to check
 * @param object options - Request options
 * @return boolean
 */
function isResourceComplete(resource, props) {
    if (!props) {
        return true;
    }

    for (var i in props) {
        if (!props.hasOwnProperty(i)) {
            continue;
        }

        if (!hasProp(resource, props[i])) {
            return false;
        }
    }

    return true;
};

/**
 * Returns true if the resource contains the specified property according to its path.
 * a.b => reach into object `a` to look for `b` property
 * a@b => reach into array `a` to look for `b` properties on each item
 *
 * @param object resource - The object to check
 * @param string prop - The property path to verify
 * @return boolean
 */
function hasProp(resource, prop) {
    if (!prop) {
        return true;
    }


    var paths = [];
    var currentPath = {
        type: 'object',
        property: ''
    };
    paths.push(currentPath);

    for (var i = 0, len = prop.length; i < len; i++) {
        var char = prop[i];

        switch (char) {
            case '.':
                currentPath = {
                    type: 'object',
                    property: ''
                };
                paths.push(currentPath);
                break;

            case '@':
                currentPath = {
                    type: 'array',
                    property: ''
                };
                paths.push(currentPath);
                break;

            default:
                currentPath.property += char;
        }
    }

    // Walk the path to see if the properties exist
    var currentObject = resource;

    for (var i = 0, len = paths.length, path; i < len; i++) {
        if (null === currentObject) {
            // Trying to fetch a nested property from a top-level object that doesn't exist.
            return false;
        }

        path = paths[i];

        switch (path.type) {
            case 'object':
                if (!currentObject.hasOwnProperty(path.property)) {
                    return false;
                }
                currentObject = currentObject[path.property];
                break;

            case 'array':
                if (!currentObject.length) {
                    currentObject = null;
                    break;
                }
                // Only check the first object
                if (!currentObject[0].hasOwnProperty(path.property)) {
                    return false;
                }
                currentObject = currentObject[0][path.property];
                break;
        }
    }

    return true;
};

function cacheResource(method, resource) {
    if ('get' === method) {
        this._cache.put(resource);
    }
    return resource;
};

function buildFullPath(base, path) {
    return (base + path).replace(/\/{2,}/g, '/');
};

function buildQuery(options) {
    var query = {}

    if (options && options.query && typeof options.query === "object") {
        for (var i in options.query) {
            query[i] = options.query[i];
        }
    }

    if (options && Array.isArray(options.props)) query.props = options.props.join(',');

    return querystring.stringify(query);
};

module.exports = Monocle;
