'use strict';

module.exports = function(angular, Monocle) {
    var AngularAdapter = require('../http_adapter/angular');
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

            var monocle = new Monocle(angularAdapter);
            monocle.setBase(this._base);

            return monocle;
        };

        this.$get.$provide = ['$http', '$q', '$window'];
    });
};
