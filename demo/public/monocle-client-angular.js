/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var monocle = __webpack_require__(1);
	var wrapper = __webpack_require__(4);
	wrapper(angular, monocle);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Store = __webpack_require__(2);
	var MemoryBackend = __webpack_require__(3);

	function Monocle(http) {
	    this._http = http;
	    this._base = '/';
	    this._cache = new Store(new MemoryBackend('monocle', { capacity: 5 }));
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
	                    return Promise.resolve(cached);
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


/***/ },
/* 2 */
/***/ function(module, exports) {

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


/***/ },
/* 3 */
/***/ function(module, exports) {

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
	    // return Object.keys(this._cache).map(function(key) {
	    //     return this._cache[key];
	    // }.bind(this));

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
	};

	var moveToHead = function(entry) {
	    if (this._head) {
	        entry.next = this._head;
	        this._head.previous = entry;
	    } else {
	        entry.next = null;
	    }

	    // Head has no previous
	    entry.previous = null;

	    this._head = entry;

	    if (!this._tail) {
	        this._tail = entry;
	    }
	};

	var purgeTail = function() {
	    if (this._head === this._tail) {
	        // Do not purge
	        return;
	    }

	    var tail = this._tail;
	    var previous = tail.previous;
	    previous.next = null;
	    this._tail = previous;
	    delete this._cache[tail.key];
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
	    if (this._cache.hasOwnProperty(cacheKey)) {
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

	        if (this._tail === entry) {
	            this._tail = previous;
	        }

	        delete this._cache[cacheKey];
	    }
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


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function angularWrapper(angular, Monocle) {
	    var AngularAdapter = __webpack_require__(5);
	    // ## Module: monocle
	    // Registers the module `monocle` with Angular,
	    // allowing Angular apps to declare this module as a dependency.
	    // This module has no dependencies of its own.
	    var module = angular.module('monocle', []);

	    // Register the `monocle` provider.
	    module.provider('monocle', function monocleProvider() {
	        this._base = '/';
	        this._timeout = 30000;
	        this._headers = {};

	        this.setBase = function(base) {
	            this._base = base;
	        };

	        this.setTimeout = function(timeout) {
	            this._timeout = parseInt(timeout, 10) || 30000;
	        };

	        this.setHeader = function(key, value) {
	            this._headers[key] = value;
	        };

	        this.$get = function($http, $q, $window) {
	            var angularAdapter = new AngularAdapter($http, $q, $window);
	            angularAdapter.setTimeout(this._timeout);
	            angularAdapter.setHeaders(this._headers);

	            var monocle = new Monocle(angularAdapter, $q);
	            monocle.setBase(this._base);

	            // Wrap all promises in Angular promises
	            ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach(function(method) {
	                monocle[method] = function(path, options) {
	                    return $q.when(Monocle.prototype[method].call(monocle, path, options));
	                };
	            });

	            return monocle;
	        };

	        this.$get.$provide = ['$http', '$q', '$window'];
	    });
	};

	module.exports = angularWrapper;


/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	function AngularAdapter($http, $q, $window) {
	    this._$http = $http;
	    this._$q = $q;
	    this._$window = $window;
	    this._timeout = 30000;
	    this._headers = {
	        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
	        'X-Requested-With': 'XMLHttpRequest'
	    };
	}

	AngularAdapter.prototype.setTimeout = function(timeout) {
	    this._timeout = parseInt(timeout, 10) || 30000;
	    return this;
	};

	AngularAdapter.prototype.setHeader = function(key, value) {
	    this._headers[key] = value;
	};

	AngularAdapter.prototype.setHeaders = function(headers) {
	    for (var i in headers) {
	        if (!headers.hasOwnProperty(i)) continue;
	        this.setHeader(i, headers[i]);
	    }
	};

	AngularAdapter.prototype.request = function(method, path, options) {
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

	    return this._$q.all(headerPromises)
	    .then(function(results) {
	        var headers = {};
	        for (var i = 0, len = results.length; i < len; i++) {
	            headers[headerKeys[i]] = results[i];
	        }

	        return this._$http({
	            method: method.toUpperCase(),
	            url: path,
	            timeout: this._timeout,
	            headers: headers
	        })
	        .catch(function(response) {
	            return this._$q.reject(response.data);
	        }.bind(this))
	        .then(function(response) {
	            return response.data;
	        });
	    }.bind(this));
	};

	module.exports = AngularAdapter;


/***/ }
/******/ ]);