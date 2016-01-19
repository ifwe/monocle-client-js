'use strict';

var clone = require('clone');
var MemoryCache = require('./memory');
var querystring = require('querystring');

function ResourceCache(cacheId, options) {
    this._cache = new MemoryCache(cacheId, options);
}

ResourceCache.prototype.generateCacheKey = function(path, query) {
    if (!query) {
        return path;
    }

    // Sort the query string parameters, because order doesn't matter
    var sortedQuery = Object.keys(query)
    .map(function(key) {
        var obj = {};
        obj[key] = query[key];
        return querystring.stringify(obj);
    }).sort();

    return path + '?' + sortedQuery.join('&');
};

ResourceCache.prototype.get = function(cacheKey) {
    return getFromCache.call(this, cacheKey);
};

function getFromCache(cacheKey) {
    var entry = clone(this._cache.get(cacheKey));

    // If parent or nested resources not in cache then return undefined.
    if (typeof entry === 'undefined' || hasExpiredNestedResources.call(this, entry)) {
        return undefined;
    }

    getNestedResourcesFromCache.call(this, entry);

    return entry;
}

function hasExpiredNestedResources(obj) {
    var keys = Object.keys(obj);
    for(var i=0; i<keys.length; i++) {
        var key = keys[i];
        if (typeof obj[key] !== 'object' || obj[key] == null) {
            continue;
        }
        if (obj[key].hasOwnProperty('key') && obj[key].hasOwnProperty('value') && obj[key].hasOwnProperty('expiration')) {
            if (typeof getFromCache.call(this, obj[key].key) === 'undefined') {
                return true;
            }
        } else {
            return hasExpiredNestedResources.call(this, obj[key]);
        }
    }

    return false;
}

function getNestedResourcesFromCache(obj) {
    var keys = Object.keys(obj);
    for(var i=0; i<keys.length; i++) {
        var key = keys[i];
        if (typeof obj[key] !== 'object' || obj[key] == null) {
            continue;
        }
        if (obj[key].hasOwnProperty('key') && obj[key].hasOwnProperty('value') && obj[key].hasOwnProperty('expiration')) {
            obj[key] = getFromCache.call(this, obj[key].key);
        } else {
            getNestedResourcesFromCache.call(this, obj[key]);
        }
    }
}

ResourceCache.prototype.getAll = function() {
    return this._cache.getAll();
};

ResourceCache.prototype.put = function(resource, query) {
    var entry = put.call(this, resource, query);
    if (entry) {
        return entry.key;
    } else {
        return undefined;
    }
};

var put = function(resource, query) {
    // Not a resource? Ignore it.
    if (!resource.hasOwnProperty('$id') || !resource.hasOwnProperty('$expires')) {
        return;
    }

    var clonedResource = clone(resource);

    putNestedResources.call(this, clonedResource);

    var cacheKey = this.generateCacheKey(clonedResource.$id, query);
    var tags = [resource.$id];

    return this._cache.put(cacheKey, clonedResource, clonedResource.$expires, tags);
};

var putNestedResources = function(obj) {
    var keys = Object.keys(obj);
    for(var i=0; i<keys.length; i++) {
        var key = keys[i];
        if (typeof obj[key] !== 'object' || obj[key] == null) {
            continue;
        }
        if (obj[key].hasOwnProperty('$id') && obj[key].hasOwnProperty('$expires')) {
            obj[key] = put.call(this, obj[key]);
        } else if (typeof obj[key] === 'object') {
            putNestedResources.call(this, obj[key]);
        }
    }
}

ResourceCache.prototype.printFromHead = function() {
    this._cache.printFromHead();
};

ResourceCache.prototype.printFromTail = function() {
    this._cache.printFromTail();
};

ResourceCache.prototype.remove = function(cacheKey) {
    this._cache.remove(cacheKey);
};

ResourceCache.prototype.removeAll = function() {
    this._cache.removeAll();
};

ResourceCache.prototype.removeMatchingTag = function(tag) {
    this._cache.removeMatchingTag(tag);
};

module.exports = ResourceCache;
