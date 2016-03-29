// Assumes jQuery, Promise is already loaded
(function($, Promise) {
    'use strict';

    var Monocle = require('./monocle');
    var JQueryAdapter = require('./http_adapter/jquery');
    var http = new JQueryAdapter($, Promise);

    $.monocle = new Monocle(http);
})(jQuery, Promise);
