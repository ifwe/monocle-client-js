// This file may run in a browser, so wrap it in an IIFE.
(function() {
    'use strict';

    var context = typeof exports !== 'undefined' ? exports : window;
    if (typeof(require) === 'function') {
        var Promise = context.Promise || require('bluebird');
    }

    var Monocle = function(http) {
        this._http = http;
        this._base = '/';
    };

    Monocle.prototype.setBase = function(base) {
        this._base = base;
        return this;
    };

    ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach(function(method) {
        Monocle.prototype[method] = function(path, options) {
            var fullPath = (this._base + path).replace(/\/{2,}/g, '/');
            var query = {};

            if (options && options.props) {
                query.props = options.props.join(',');
            }

            var queryStringParts = [];
            for (var i in query) {
                queryStringParts.push(encodeURIComponent(i) + '=' + encodeURIComponent(query[i]));
            }
            if (queryStringParts.length) {
                fullPath += '?' + queryStringParts.join('&');
            }

            return this._http.request(method.toUpperCase(), fullPath, options);
        };
    });

    if (typeof exports !== 'undefined') {
        // We're in a nodejs environment, export this module
        module.exports = Monocle;
    } else {
        // We're in a browser environment, expose this module globally
        context.Monocle = Monocle;
    }
})();

// This file is generally run in a browser, so wrap it in an IIFE
(function() {
    'use strict';

    var context = typeof exports !== 'undefined' ? exports : window;

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

    if (typeof exports !== 'undefined') {
        // We're in a nodejs environment, export this module (useful for unit testing)
        module.exports = AngularAdapter;
    } else {
        // We're in a browser environment, export this module globally,
        // attached to the TaggedApi module
        var Monocle = context.Monocle || {};
        Monocle.AngularAdapter = AngularAdapter;
    }
})();

// This file is generally run in a browser, so wrap it in an IIFE
(function() {
    'use strict';

    var wrapper = function(angular, Monocle) {
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
                var angularAdapter = new Monocle.AngularAdapter($http, $q, $window);
                angularAdapter.setTimeout(this._timeout);
                angularAdapter.setHeaders(this._headers);

                var monocle = new Monocle(angularAdapter);
                monocle.setBase(this._base);

                return monocle;
            };

            this.$get.$provide = ['$http', '$q', '$window'];
        });
    };

    if (typeof exports !== 'undefined') {
        // We're in a nodejs environment, export this module
        module.exports = wrapper;
    } else {
        // We're in a browser environment, expose this module globally
        Monocle.angularWrapper = wrapper;
    }
})();
Monocle.angularWrapper(angular, Monocle);