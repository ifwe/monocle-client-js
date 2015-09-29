// This file is generally run in a browser, so wrap it in an IIFE
(function() {
    'use strict';

    var context = typeof exports !== 'undefined' ? exports : window;

    function AngularAdapter($http, $q, $window) {
        this._$http = $http;
        this._$q = $q;
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
        })
        .catch(function(response) {
            return this._$q.reject(response.data);
        }.bind(this))
        .then(function(response) {
            return response.data;
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
