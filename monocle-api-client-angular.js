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
    };

    ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach(function(method) {
        Monocle.prototype[method] = function(path, options) {
            var fullPath = (this._base + path).replace(/\/{2,}/g, '/');
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

    AngularAdapter.$inject = ['$http', '$window'];
    function AngularAdapter($http, $window) {
        this._$http = $http;
        this._$window = $window;
        this._timeout = 10000;
    }

    AngularAdapter.prototype.setTimeout = function(timeout) {
        this._timeout = parseInt(timeout, 10) || 10000;
    };

    AngularAdapter.prototype.request = function(method, path, options) {
        var headers = {
            // 'x-tagged-client-id': req.clientId,
            'x-tagged-client-url': this._$window.location.href,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
        };

        return this._$http({
            method: method.toUpperCase(),
            url: path,
            timeout: this._timeout,
            headers: headers
        }).then(function(result) {
            return result.data;
        });
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
            // monocleProvider.timeout = 30000;

            this.setBase = function(base) {
                this._base = base;
            };

            this.$get = ['$http', '$q', '$window', function($http, $q, $window) {
                var angularAdapter = new Monocle.AngularAdapter($http, $window);
                var monocle = new Monocle(angularAdapter);
                monocle.setBase(this._base);

                // Wrap HTTP methods in an Angular promise
                ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach(function(method) {
                    monocle[method] = function(path, options) {
                        return $q.when(Monocle.prototype[method].call(this, path, options));
                    };
                }.bind(this));

                return monocle;
            }];
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