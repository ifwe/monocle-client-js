// Assumes Promise is already loaded
(function(context) {
    'use strict';

    var Monocle = require('./monocle');
    var VanillaAdapter = require('./http_adapter/vanilla');
    // @ts-ignore XMLHttpRequest and Window not found
    var http = new VanillaAdapter(context.XMLHttpRequest, context.Promise);

    // @ts-ignore adding property to Window
    context.monocle = new Monocle(http);
})(window);
