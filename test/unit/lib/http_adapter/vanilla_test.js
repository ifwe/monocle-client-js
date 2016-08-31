var VanillaAdapter = require(LIB_DIR + '/http_adapter/vanilla');
var Promise = require('bluebird');

function mockXMLHttpRequestFactory() {
    var expectedRequests = [];
    var allRequests = [];

    var MockXMLHttpRequest = function() {
        this._headers = {};
    };

    MockXMLHttpRequest.prototype.open = function(method, url, async) {
        this._method = method;
        this._url = url;
        this._async = async;
    };

    MockXMLHttpRequest.prototype.onreadystatechange = undefined;

    MockXMLHttpRequest.prototype.send = function(body) {
        // Look through stubbed requests and immediately respond
        for (var i in expectedRequests) {
            var request = expectedRequests[i].request;

            if (request.method !== this._method) {
                continue;
            }

            if (request.url !== this._url) {
                continue;
            }

            if (request.body && request.body !== body) {
                continue;
            }

            // Found matching request
            var response = expectedRequests[i].response;
            expectedRequests.splice(i, 1);
            this.readyState = 4;
            this.responseText = response.body;
            allRequests.push({
                xhr: this,
                request: request,
                response: response
            });
            this.onreadystatechange();
            return;
        }

        // Not found
        throw new Error('Unexpected request: ' + this._method + ' ' + this._url);
    };

    MockXMLHttpRequest.prototype.setRequestHeader = function(key, value) {
        this._headers[key] = value;
    };

    MockXMLHttpRequest.prototype.getRequestHeaders = function() {
        return this._headers;
    };

    MockXMLHttpRequest.expectRequest = function(request, response) {
        if (typeof request === 'string') {
            request = {
                method: 'GET',
                url: request
            };
        }

        if (typeof response === 'string') {
            response = {
                body: response
            };
        }

        expectedRequests.push({
            request: request,
            response: response
        });

        return this;
    };

    MockXMLHttpRequest.lastRequest = function() {
        return allRequests[allRequests.length - 1];
    };

    MockXMLHttpRequest.verifyNoPendingRequests = function() {
        if (expectedRequests.length) {
            throw new Error("Pending requests found: " + expectedRequests.map(function(r) {
                return r.url
            }).join(', '));
        }
    }

    return MockXMLHttpRequest;
}

describe('Vanilla Adapter', function() {
    var xhr = null;

    beforeEach(function() {
        this.MockXMLHttpRequest = mockXMLHttpRequestFactory();
        this.adapter = new VanillaAdapter(this.MockXMLHttpRequest, Promise);
        this.clock = sinon.useFakeTimers(10000);
    });

    afterEach(function() {
        this.clock.restore();
    });

    it('is a constructor', function() {
        VanillaAdapter.should.be.a('function');
    });

    describe('request()', function() {
        beforeEach(function() {
            this.options = {};
        });

        it('is a function', function() {
            this.adapter.request.should.be.a('function');
        });

        it('appends cache buster to GET without query string', function() {
            this.MockXMLHttpRequest.expectRequest('/foo?_10000', '{}');
            return this.adapter.request('get', '/foo')
            .then(function(result) {
                this.MockXMLHttpRequest.verifyNoPendingRequests();
            }.bind(this));
        });

        it('appends cache buster to GET with query string', function() {
            this.MockXMLHttpRequest.expectRequest('/foo?bar=test_bar&_10000', '{}');
            return this.adapter.request('get', '/foo?bar=test_bar')
            .then(function(result) {
                this.MockXMLHttpRequest.verifyNoPendingRequests();
            }.bind(this));
        });

        it('sets data accordingly in XHR request', function() {
            this.options.body = { foo: 'test foo' };
            this.MockXMLHttpRequest.expectRequest({
                method: 'POST',
                url: '/foo',
                body: '{"foo":"test foo"}'
            }, '{}');
            return this.adapter.request('post', '/foo', this.options)
            .then(function(result) {
                this.MockXMLHttpRequest.verifyNoPendingRequests();
            }.bind(this));
        });

        ['get', 'post', 'put', 'patch', 'delete'].forEach(function(method) {
            describe('with http method: ' + method, function() {
                it('makes ' + method + ' request using vanilla XHR', function() {
                    this.MockXMLHttpRequest.expectRequest({
                        method: method.toUpperCase(),
                        url: ('get' === method ? '/foo?_10000' : '/foo')
                    }, '{}');
                    return this.adapter.request(method, '/foo')
                    .then(function(result) {
                        this.MockXMLHttpRequest.verifyNoPendingRequests();
                    }.bind(this));
                });

                it('formats resolved ' + method + ' response', function() {
                    this.MockXMLHttpRequest.expectRequest({
                        method: method.toUpperCase(),
                        url: ('get' === method ? '/foo?_10000' : '/foo')
                    }, '{"foo":"test foo"}');
                    return this.adapter.request(method, '/foo')
                    .then(function(result) {
                        this.MockXMLHttpRequest.verifyNoPendingRequests();
                        result.should.have.property('foo', 'test foo');
                    }.bind(this));
                });

                describe('timeout', function() {
                    it('defaults to 30s', function() {
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo')
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.should.have.property('timeout', 30000);
                        }.bind(this));
                    });

                    it('can be overwritten', function() {
                        this.adapter.setTimeout(5000);
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo')
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.should.have.property('timeout', 5000);
                        }.bind(this));
                    });
                });

                describe('headers', function() {
                    it('sets `Content-Type` header', function() {
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo')
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('Content-Type', 'application/json');
                        }.bind(this));
                    });

                    it('sets `X-Requested-With` header', function() {
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo')
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('X-Requested-With', 'XMLHttpRequest');
                        }.bind(this));
                    });

                    it('supports custom header', function() {
                        this.adapter.setHeader('x-custom-test', 'test value');
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo')
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('x-custom-test', 'test value');
                        }.bind(this));
                    });

                    it('supports many custom headers', function() {
                        this.adapter.setHeaders({
                            'x-custom-test-1': 'test value 1',
                            'x-custom-test-2': 'test value 2',
                            'x-custom-test-3': 'test value 3'
                        });
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo')
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('x-custom-test-1', 'test value 1');
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('x-custom-test-2', 'test value 2');
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('x-custom-test-3', 'test value 3');
                        }.bind(this));
                    });

                    it('supports callback function to generate header value', function() {
                        this.adapter.setHeader('x-custom-callback', function() {
                            return 'test value';
                        });
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo')
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('x-custom-callback', 'test value');
                        }.bind(this));
                    });

                    it('supports promise to generate header value', function() {
                        this.adapter.setHeader('x-custom-promise', Promise.resolve('test value'));
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo')
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('x-custom-promise', 'test value');
                        }.bind(this));
                    });

                    it('supports callback function that returns a promise to generate header value', function() {
                        this.adapter.setHeader('x-custom-callback-promise', function() {
                            return Promise.resolve('test value');
                        });
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo')
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('x-custom-callback-promise', 'test value');
                        }.bind(this));
                    });
                });

                describe('custom header', function() {
                    it('is included in HTTP request', function() {
                        this.headers = {'x-custom-for-call': 'test custom'};
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo', {}, this.headers)
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('x-custom-for-call', 'test custom');
                        }.bind(this));
                    });

                    it('merges with global custom headers', function() {
                        this.adapter.setHeader('x-custom-test-1', 'test value 1');
                        this.headers = {'x-custom-test-2': 'test value 2'};
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo', {}, this.headers)
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('x-custom-test-1', 'test value 1');
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('x-custom-test-2', 'test value 2');
                        }.bind(this));
                    });

                    it('overrides global custom headers', function() {
                        this.adapter.setHeader('x-custom-test', 'test value');
                        this.headers = {'x-custom-test': 'test value override'};
                        this.MockXMLHttpRequest.expectRequest({
                            method: method.toUpperCase(),
                            url: ('get' === method ? '/foo?_10000' : '/foo')
                        }, '{"foo":"test foo"}');
                        return this.adapter.request(method, '/foo', {}, this.headers)
                        .then(function(result) {
                            this.MockXMLHttpRequest.verifyNoPendingRequests();
                            this.MockXMLHttpRequest.lastRequest().xhr.getRequestHeaders().should.have.property('x-custom-test', 'test value override');
                        }.bind(this));
                    });
                });
            });
        });
    });
});
