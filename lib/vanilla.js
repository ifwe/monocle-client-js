// Assumes Promise is already loaded
(function(context) {
    'use strict';

    var Monocle = require('./monocle');
    var VanillaAdapter = require('./http_adapter/vanilla');
    var http = new VanillaAdapter(context.XMLHttpRequest, context.Promise);

    context.monocle = new Monocle(http);
})(window);
