// Assumes jQuery is already loaded
(function($) {
    'use strict';

    var Monocle = require('./monocle');
    var Promise = require('bluebird');
    var JQueryAdapter = require('./http_adapter/jquery');
    var http = new JQueryAdapter($, Promise);

    $.monocle = new Monocle(http, Promise);
})(jQuery);
