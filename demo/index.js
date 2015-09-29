var Promise = require('bluebird');
var Monocle = require('monocle-api');

/*** Set up simple HTTP server ***/

var connect = require('connect');
var app = connect();
var serveStatic = require('serve-static');
var path = require('path');

// Allow method override via ?_method=METHOD query string parameter
var methodOverride = require('method-override');
app.use(methodOverride('_method', {
    methods: [ 'GET', 'POST' ] // Specifies which methods can support overrides
}));
var bodyParser = require('body-parser');
app.use(bodyParser.json());

var api = new Monocle();

api.route('/users/:userId', {
    type: 'object',
    properties: {
        userId: { type: 'integer' },
        displayName: { type: 'string' },
        age: { type: 'integer' }
    }
}, {
    // Complex resources may need multiple callback handlers to support different properties.
    // The API router will figure out which callbacks are necessary to satisfy the incoming request.
    get: function(req) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                var userId = req.getParam('userId');
                if (userId > 0 && userId < 100) {
                    // within range of acceptible user ids
                    return resolve({
                        userId: userId,
                        displayName: 'FPO Display Name ' + userId,
                        age: 27
                    });
                }

                reject('Invalid user id');
            }, 200);
        });
    }
});

app.use(api.middleware({
    basePath: '/demo'
}));

app.use(serveStatic(path.join(__dirname, 'public')));

api.on('api:success', function(data) {
    console.log('Success!!', data.resourceId);
});

api.on('api:error', function(data) {
    console.log('Error :(', data.resourceId);
});

// Create web server and listen on port 8080
var http = require('http');
http.createServer(app).listen(8080, function() {
    console.log("API Router Demo listening on port 8080");
    console.log("View documentation: http://localhost:8080/demo");
    console.log("View Angular demo: http://localhost:8080/angular.html");
});
