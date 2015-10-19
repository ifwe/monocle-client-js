'use strict';

function MemoryCache(cacheId, options) {
    this._cacheId = cacheId;
    this._cache = {};
    this._head = null;
    this._tail = null;
    this._options = options || {};
    if (!this._options.hasOwnProperty('capacity')) {
        this._options.capacity = false;
    }
};

MemoryCache.prototype.get = function(cacheKey) {
    if (!this._cache.hasOwnProperty(cacheKey)) {
        return undefined;
    }

    var entry = this._cache[cacheKey];

    if (entry.expiration) {
        var now = new Date();
        if (now.getTime() > entry.expiration.getTime()) {
            this.remove(cacheKey);
            return undefined;
        }
    }

    moveToHead.call(this, entry);

    return entry.value;
};

MemoryCache.prototype.getAll = function() {
    var all = {};
    for (var i in this._cache) {
        var cached = this._cache[i];
        all[i] = {
            value: cached.value,
            expiration: cached.expiration
        };
    }
    return all;
};

MemoryCache.prototype.put = function(cacheKey, value, ttl, tags) {
    if (!Array.isArray(tags)) {
        tags = toString.call(tags) == '[object String]' ? [tags] : [];
    }

    var entry = {
        key: cacheKey,
        value: value,
        expiration: false,
        tags: tags
    };

    ttl = parseInt(ttl, 10);

    if (isFinite(ttl) && ttl > 0) {
        entry.expiration = new Date(new Date().getTime() + ttl);
    }

    moveToHead.call(this, entry);

    this._cache[cacheKey] = entry;

    var size = Object.keys(this._cache).length;

    if (this._options.capacity > 0 && size > this._options.capacity) {
        clearExpired.call(this);

        if (Object.keys(this._cache).length > this._options.capacity) {
            purgeTail.call(this);
        }
    }

    return entry;
};

MemoryCache.prototype.printFromHead = function() {
    if (!this._head) return '';

    var keys = [];
    var entry = this._head;
    while (entry) {
        keys.push(entry.key);
        entry = entry.next;
    }

    return keys.join(' > ');
};

MemoryCache.prototype.printFromTail = function() {
    if (!this._tail) return '';

    var keys = [];
    var entry = this._tail;
    while (entry) {
        keys.push(entry.key);
        entry = entry.previous;
    }

    return keys.join(' < ');
};

var moveToHead = function(entry) {
    if (entry === this._head) return;

    var next = entry.next;
    var previous = entry.previous;

    if (next) {
        next.previous = previous;
    }

    if (previous) {
        previous.next = next;
    }

    if (this._head) {
        entry.next = this._head;
        this._head.previous = entry;
    } else {
        entry.next = null;
    }

    // Head has no previous
    entry.previous = null;

    this._head = entry;

    if (this._tail === entry) {
        this._tail = previous;
    }

    if (!this._tail) {
        this._tail = entry;
    }
};

var purgeTail = function() {
    if (this._head === this._tail) {
        // Do not purge
        return;
    }

    if (this._tail) this.remove(this._tail.key);
};

var clearExpired = function() {
    var now = new Date();
    Object.keys(this._cache).forEach(function(cacheKey) {
        var entry = this._cache[cacheKey];
        if (entry.expiration) {
            if (now.getTime() > entry.expiration.getTime()) {
                this.remove(cacheKey);
            }
        }
    }.bind(this));
};

MemoryCache.prototype.remove = function(cacheKey) {
    if (!this._cache.hasOwnProperty(cacheKey)) {
        return;
    }

    var entry = this._cache[cacheKey];

    // Update the doubly-linked list pointers
    var previous = entry.previous;
    var next = entry.next;

    if (previous) {
        previous.next = next;
    }

    if (next) {
        next.previous = previous;
    }

    if (this._head === entry) {
        this._head = next;
    }

    if (this._tail === entry) {
        this._tail = previous;
    }

    delete this._cache[cacheKey];
};

MemoryCache.prototype.removeAll = function() {
    this._cache = {};
    this._head = null;
    this._tail = null;
};

MemoryCache.prototype.removeMatchingTag = function(tag) {
    // TODO: Use a faster lookup, perhaps a map?
    Object.keys(this._cache).forEach(function(cacheKey) {
        var entry = this._cache[cacheKey];
        if (-1 !== entry.tags.indexOf(tag)) {
            this.remove(cacheKey);
        }
    }.bind(this));
};

module.exports = MemoryCache;
