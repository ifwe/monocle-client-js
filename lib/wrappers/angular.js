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

            this.$get = function($http, $q, $window) {
                var angularAdapter = new Monocle.AngularAdapter($http, $q, $window);
                var monocle = new Monocle(angularAdapter);
                monocle.setBase(this._base);

                // Wrap HTTP methods in an Angular promise
                ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach(function(method) {
                    monocle[method] = function(path, options) {
                        return $q.when(Monocle.prototype[method].call(this, path, options));
                    };
                }.bind(this));

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
