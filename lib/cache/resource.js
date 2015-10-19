'use strict';

var _ = require('lodash');
var MemoryCache = require('./memory');

function ResourceCache(cacheId, options) {
    this._cache = new MemoryCache(cacheId, options);
}

ResourceCache.prototype.get = function(cacheKey) {
    return getFromCache.call(this, cacheKey);
};

function getFromCache(cacheKey) {
    var entry = _.cloneDeep(this._cache.get(cacheKey));

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

ResourceCache.prototype.put = function(resource, tags) {
    var entry = put.call(this, resource, tags);
    if (entry) {
        return entry.key;
    } else {
        return undefined;
    }
};

var put = function(resource, tags) {
    // Not a resource? Ignore it.
    if (!resource.hasOwnProperty('$id') || !resource.hasOwnProperty('$expires')) {
        return;
    }

    var clonedResource = _.cloneDeep(resource);

    putNestedResources.call(this, clonedResource);

    return this._cache.put(clonedResource.$id, clonedResource, clonedResource.$expires, tags);
};

var putNestedResources = function(obj, tags) {
    var keys = Object.keys(obj);
    for(var i=0; i<keys.length; i++) {
        var key = keys[i];
        if (typeof obj[key] !== 'object' || obj[key] == null) {
            continue;
        }
        if (obj[key].hasOwnProperty('$id') && obj[key].hasOwnProperty('$expires')) {
            obj[key] = put.call(this, obj[key], tags);
        } else if (typeof obj[key] === 'object') {
            putNestedResources.call(this, obj[key], tags);
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
