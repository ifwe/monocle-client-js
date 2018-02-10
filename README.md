Monocle API Client for JavaScript
=================================

Monocle is a schema-powered API router that focuses on consistency, flexibility and performance.

QuickStart
----------

Getting started with Monocle is simple:


1. Add Angular and Monocle scripts to your page
2. Add `monocle` as a dependency to your Angular application.
3. Inject `monocle` and start making API calls!

```js
// Add `monocle` as a dependency:
var app = angular.module('app', ['monocle']);

// Inject `monocle` to gain easy access to a Monocle-powered API
app.service('Users', function(monocle) {
    this.get = function(userId) {
        return monocle.get('/users/' + userId, {
            props: ['userId', 'displayName', 'age']
        });
    };
});
```

Configuration
-------------

The monocle client can be configured in your app's config phase.

```js
// Configure the Monocle client:
app.config(function(monocleProvider) {
    // Set the base path for API calls.
    // All API calls will automatically be mounted onto this base path.
    monocleProvider.setBase('/api');

    // Set a custom timeout to be used by all requests (default: 30,000ms).
    monocleProvider.setTimeout(10000);

    // Set a custom header by value.
    monocleProvider.setHeader('x-custom-value', 'test-custom-value');

    // Set a custom header by providing a callback function.
    // The function will be called for each HTTP request to the Monocle server,
    // and its return value will be the value for the header.
    // If the function returns a promise, it will be resolved first.
    monocleProvider.setHeader('x-custom-callback', function() {
        return 'test-custom-callback-' + Math.random();
    });

    // Set a custom header by providing a promise.
    // The resolved value will be used as the header value.
    monocleProvider.setHeader('x-custom-promise', Promise.resolve('test-custom-promise'));

    // Set a custom header by providing a function that returns a promise.
    // The resolved value will be used as the header value.
    monocleProvider.setHeader('x-custom-promise-callback', function() {
        return Promise.resolve('test-custom-promise-callback');
    });
});
```

The monocle node adapter can be configured in your app's config phase.

```js
var monocle = require('monocle-client-js');

// Configure the Monocle Node Adapter:
var nodeAdapter = new monocle.nodeAdapter();

// Set a custom timeout to be used by all requests.
nodeAdapter.setTimeout(30000);

// Set a custom header by value.
nodeAdapter.setHeader('x-custom-value', 'custom_client_value');

var monocleProvider = new monocle(nodeAdapter);

// Set the host path for API calls.
// All API calls will automatically be mounted onto this host path.
monocleProvider.setHost('http://www.yourhost.com');

// Set the base path for API calls.
// All API calls will automatically be mounted onto this base path.
monocleProvider.setBase('/api/v2');
```

To make a request with the node adapter or with the monocle client

```js
// FOR GET
//The second parameter takes an optional object where props or query can be passed in
monocleProvider.get('/endpoint', {props: PROPS, query: QUERY);

//FOR POST, PUT, PATCH OR DELETE
//The second parameter takes an optional object where the body of the request can be passed in
//Note: Currently the node adapter does not support the body parameter to be passed in
monocleProvider.post('/endpoint', {body: {param: 'param1'});
monocleProvider.patch('/endpoint', {body: {param: 'param1'});
monocleProvider.put('/endpoint', {body: {param: 'param1'});
monocleProvider.delete('/endpoint');

//Examples:
monocleProvider.get('/users/123', {props: ['name'], query: {new: false}});
monocleProvider.post('/users/345', {body: {name : 'Mariane'}});
monocleProvider.patch('/users/123', {body: {name : 'Mariane'}});
monocleProvider.put('/users/123', {body: {name : 'Mariane'}});
monocleProvider.delete('/users/123'); //Deletes user 123
```

