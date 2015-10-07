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
	var wrapper = __webpack_require__(7);
	wrapper(angular, monocle);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Store = __webpack_require__(2);
	var MemoryBackend = __webpack_require__(3);
	var querystring = __webpack_require__(4);

	function Monocle(http) {
	    this._http = http;
	    this._base = '/';
	    this._cache = new Store(new MemoryBackend('monocle', { capacity: 100 }));
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
	    return querystring.stringify(query);
	};

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


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.decode = exports.parse = __webpack_require__(5);
	exports.encode = exports.stringify = __webpack_require__(6);


/***/ },
/* 5 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	module.exports = function(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};

	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }

	  var regexp = /\+/g;
	  qs = qs.split(sep);

	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }

	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }

	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;

	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }

	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);

	    if (!hasOwnProperty(obj, k)) {
	      obj[k] = v;
	    } else if (isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }

	  return obj;
	};

	var isArray = Array.isArray || function (xs) {
	  return Object.prototype.toString.call(xs) === '[object Array]';
	};


/***/ },
/* 6 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	var stringifyPrimitive = function(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;

	    case 'boolean':
	      return v ? 'true' : 'false';

	    case 'number':
	      return isFinite(v) ? v : '';

	    default:
	      return '';
	  }
	};

	module.exports = function(obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }

	  if (typeof obj === 'object') {
	    return map(objectKeys(obj), function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (isArray(obj[k])) {
	        return map(obj[k], function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);

	  }

	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	};

	var isArray = Array.isArray || function (xs) {
	  return Object.prototype.toString.call(xs) === '[object Array]';
	};

	function map (xs, f) {
	  if (xs.map) return xs.map(f);
	  var res = [];
	  for (var i = 0; i < xs.length; i++) {
	    res.push(f(xs[i], i));
	  }
	  return res;
	}

	var objectKeys = Object.keys || function (obj) {
	  var res = [];
	  for (var key in obj) {
	    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
	  }
	  return res;
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function angularWrapper(angular, Monocle) {
	    var AngularAdapter = __webpack_require__(8);
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
/* 8 */
/***/ function(module, exports) {

	'use strict';

	function AngularAdapter($http, $q, $window) {
	    this._$http = $http;
	    this._$q = $q;
	    this._$window = $window;
	    this._timeout = 30000;
	    this._headers = {
	        'Content-Type': 'application/json',
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
	            headers: headers,
	            data: (options && options.body)
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