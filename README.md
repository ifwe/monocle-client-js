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
