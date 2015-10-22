/*jshint expr: true*/
var Monocle = require(LIB_DIR + '/monocle');
var HttpMock = require('./mocks/http.js');
var Promise = require('bluebird');

describe('Monocle API Client', function() {
    beforeEach(function() {
        this.http = new HttpMock();
        sinon.spy(this.http, 'request');
        this.api = new Monocle(this.http);
        this.clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        this.clock.restore();
    });

    it('is a constructor', function() {
        Monocle.should.be.a('function');
    });

    describe('Common functionality across HTTP methods', function() {
        ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach(function(method) {
            describe(method + '()', function() {
                it('returns a promise', function() {
                    this.http.mock(method, '/foo');
                    this.api[method]('/foo').should.have.property('then');
                });

                it('makes ' + method + ' request to path', function() {
                    this.http.mock(method, '/foo');
                    this.api[method]('/foo');
                    this.clock.tick();
                    this.http.request.calledWith(method.toUpperCase(), '/foo').should.be.true;
                });

                it('prepends base path if provided', function() {
                    this.api.setBase('/my-base');
                    this.http.mock(method, '/my-base/foo');
                    this.api[method]('/foo');
                    this.clock.tick();
                    this.http.request.calledWith(method.toUpperCase(), '/my-base/foo').should.be.true;
                });

                it('appends props as a query string parameter', function() {
                    this.http.mock(method, '/foo', {
                        props: ['alpha', 'beta', 'gamma']
                    });
                    this.api[method]('/foo', {
                        props: ['alpha', 'beta', 'gamma']
                    });
                    this.clock.tick();
                    this.http.request.calledWith(method.toUpperCase(), '/foo?props=alpha%2Cbeta%2Cgamma').should.be.true;
                });

                it('resolves with value from successful HTTP call', function() {
                    this.http.mock(method, '/foo').resolvesWith({ foo: 'test foo' });

                    var promise = this.api[method]('/foo');
                    this.clock.tick();

                    return promise.then(function(result) {
                        result.should.deep.equal({
                            foo: 'test foo'
                        });
                    }.bind(this));
                });

                it('rejects with error from unsuccessful HTTP call', function() {
                    this.http.mock(method, '/foo').rejectsWith('test error');

                    var promise = this.api[method]('/foo');
                    this.clock.tick();

                    return promise.then(function(result) {
                        throw new Error('Did not expect success handler to be called');
                    }.bind(this))
                    .catch(function(error) {
                        error.should.equal('test error');
                    });
                });
            });
        });
    });

    describe('caching', function() {
        beforeEach(function() {
            this.http.mock('GET', '/cacheable').resolvesWith({
                foo: 'test cacheable',
                $expires: 5000,
                $id: '/cacheable'
            });

            this.http.mock('GET', '/uncacheable').resolvesWith({
                foo: 'test uncacheable'
            });
        });

        it('returns cached value if resource is cacheable and within time limit', function() {
            var promise = this.api.get('/cacheable');
            this.clock.tick();

            return promise.then(function(result1) {
                return this.api.get('/cacheable')
                .then(function(result2) {
                    this.http.request.calledOnce.should.be.true;
                    result1.should.deep.equal(result2);
                }.bind(this));
            }.bind(this));
        });

        it('makes new http request if cached resource is expired', function() {
            var promise1 = this.api.get('/cacheable');
            this.clock.tick();

            return promise1.then(function(result1) {
                this.clock.tick(5001);
                var promise2 = this.api.get('/cacheable');
                this.clock.tick();

                return promise2.then(function(result2) {
                    this.http.request.calledTwice.should.be.true;
                    result1.should.equal(result2);
                }.bind(this));
            }.bind(this));
        });

        it('makes new http request if resource is not cacheable', function() {
            var promise1 = this.api.get('/uncacheable');
            this.clock.tick();

            return promise1.then(function(result1) {
                var promise2 = this.api.get('/uncacheable');
                this.clock.tick();

                promise2.then(function(result2) {
                    this.http.request.calledTwice.should.be.true;
                    result1.should.equal(result2);
                }.bind(this));
            }.bind(this));
        });
    });

    describe('multiple calls', function() {
        beforeEach(function() {
            this.http.mock('POST', '/_batch', {
                body: [
                    { method: 'get', 'url': '/foo' },
                    { method: 'get', 'url': '/bar' }
                ]
            }).resolvesWith([
                {
                    status: 200,
                    body: { foo: 'test foo' }
                },
                {
                    status: 200,
                    body: { foo: 'test bar' }
                }
            ]);

            this.http.mock('POST', '/_batch', {
                body: [
                    { method: 'get', 'url': '/resolved' },
                    { method: 'get', 'url': '/rejected' }
                ]
            }).resolvesWith([
                {
                    status: 200,
                    body: { foo: 'test foo' }
                },
                {
                    status: 404,
                    body: { error: 'test error' }
                }
            ]);
        });

        it('batches into a single request', function() {
            var promise1 = this.api.get('/foo');
            var promise2 = this.api.get('/bar');
            this.clock.tick();
            return Promise.all([
                promise1,
                promise2
            ]).then(function(results) {
                this.http.request.calledWith('POST', '/_batch').should.be.true;
            }.bind(this));
        });

        it('resolves each promise independently', function() {
            var promise1 = this.api.get('/foo');
            var promise2 = this.api.get('/bar');
            this.clock.tick();
            return Promise.all([
                promise1.then(function(resource) {
                    resource.should.contain({ foo: 'test foo' })
                }),
                promise2.then(function(resource) {
                    resource.should.contain({ foo: 'test bar' })
                })
            ]);
        });

        it('supports mixed rejections and resolves', function() {
            var promise1 = this.api.get('/resolved');
            var promise2 = this.api.get('/rejected');
            this.clock.tick();
            return Promise.settle([
                promise1,
                promise2
            ]).then(function(results) {
                promise1.isFulfilled().should.be.true;
                promise2.isRejected().should.be.true;
            });
        });

        it('rejects all promises if http request is rejected', function() {
            var promise1 = this.api.get('/http-failure-1');
            var promise2 = this.api.get('/http-failure-2');
            this.clock.tick();
            return Promise.settle([
                promise1,
                promise2
            ]).then(function(results) {
                promise1.isRejected().should.be.true;
                promise2.isRejected().should.be.true;
            });
        });
    });

    describe('duplicate GETs', function() {
        beforeEach(function() {
            this.http.mock('GET', '/dupe').resolvesWithDelay(500, {
                foo: 'test foo'
            });
        });

        it('makes only one HTTP request', function() {
            var promise1 = this.api.get('/dupe');
            var promise2 = this.api.get('/dupe');
            this.clock.tick(500);
            return Promise.settle([
                promise1,
                promise2
            ]).then(function(results) {
                promise1.isFulfilled().should.be.true;
                promise2.isFulfilled().should.be.true;
                this.http.request.calledOnce.should.be.true;
            }.bind(this));
        });

        it('makes a new HTTP request if previous one has been fulfilled', function() {
            var promise1 = this.api.get('/dupe');
            var promise2 = this.api.get('/dupe');
            this.clock.tick(500);

            return Promise.settle([
                promise1,
                promise2
            ]).then(function(results) {
                var promise3 = this.api.get('/dupe');
                var promise4 = this.api.get('/dupe');
                this.clock.tick(500);

                return Promise.settle([
                    promise1,
                    promise2
                ]).then(function(results) {
                    promise3.isFulfilled().should.be.true;
                    promise4.isFulfilled().should.be.true;
                    this.http.request.calledTwice.should.be.true;
                }.bind(this));
            }.bind(this));
        });
    });
});
