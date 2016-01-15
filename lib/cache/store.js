'use strict';

function Store(backend) {
    this._backend = backend;
};

Store.prototype.get = function(cacheKey) {
    return this._backend.get(cacheKey);
};

Store.prototype.put = function(cacheKey, query) {
    return this._backend.put(cacheKey, query);
};

Store.prototype.remove = function(cacheKey) {
    return this._backend.remove(cacheKey);
};

Store.prototype.getAll = function() {
    return this._backend.getAll();
};

Store.prototype.removeMatchingTag = function(tag) {
    return this._backend.removeMatchingTag(tag);
};

Store.prototype.generateCacheKey = function(object, query) {
    return this._backend.generateCacheKey(object, query);
};

module.exports = Store;
