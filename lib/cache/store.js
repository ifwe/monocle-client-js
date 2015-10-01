'use strict';

function Store(backend) {
    this._backend = backend;
};

Store.prototype.get = function(cacheKey) {
    return this._backend.get(cacheKey);
};

Store.prototype.put = function(cacheKey, value, ttl) {
    return this._backend.put(cacheKey, value, ttl);
};

Store.prototype.remove = function(cacheKey) {
    return this._backend.remove(cacheKey);
};

Store.prototype.getAll = function() {
    return this._backend.getAll();
};

module.exports = Store;
