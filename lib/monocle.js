'use strict';

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

module.exports = Monocle;
