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

                it('prepends host if provided', function() {
                    this.api.setHost('http://www.hello.com');
                    this.http.mock(method, 'http://www.hello.com/foo');
                    this.api[method]('/foo');
                    this.clock.tick();
                    this.http.request.calledWith(method.toUpperCase(), 'http://www.hello.com/foo').should.be.true;
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

                it('returns rejected promise if props is not an array', function() {
                    var promise = this.api[method]('/foo', {
                        props: 'any string'
                    });
                    this.clock.tick();
                    return promise
                    .then(function(result) {
                        throw new Error("Did not expect promise to resolve");
                    })
                    .catch(function(error) {
                        error.should.contain({
                            code: 422,
                            message: 'Invalid props, expecting an array of strings'
                        });
                    });
                });

                it('returns rejected promise if props is an empty array', function() {
                    var promise = this.api[method]('/foo', {
                        props: []
                    });
                    this.clock.tick();
                    return promise
                    .then(function(result) {
                        throw new Error("Did not expect promise to resolve");
                    })
                    .catch(function(error) {
                        error.should.contain({
                            code: 422,
                            message: 'Invalid props, expecting one or more'
                        });
                    });
                });

                [
                    null,
                    true,
                    false,
                    '',
                    '      ',
                    ' anything ',
                    '☃',
                    {},
                    [],
                    0,
                    1,
                    -1,
                    1.23,
                    Infinity,
                    function() {}
                ].forEach(function(invalidProp) {
                    it('returns rejected promise if props contains an invalid prop: ' + JSON.stringify(invalidProp), function() {
                        var promise = this.api[method]('/foo', {
                            props: ['foo', 'bar', invalidProp, 'derp', 'berp']
                        });
                        this.clock.tick();
                        return promise
                        .then(function(result) {
                            throw new Error("Did not expect promise to resolve");
                        })
                        .catch(function(error) {
                            error.should.contain({
                                code: 422,
                                message: 'Invalid props, expecting an array of strings'
                            });
                        });
                    });
                });

                it('appends query object to query string with no props', function() {
                    this.http.mock(method, '/foo', {
                        query: {offset: 1, limit: 3},
                    });
                    this.api[method]('/foo', {
                        query: {offset: 1, limit: 3}
                    });
                    this.clock.tick();
                    this.http.request.calledWith(method.toUpperCase(), '/foo?offset=1&limit=3').should.be.true;
                });

                it('appends query object to query string with props', function() {
                    this.http.mock(method, '/foo', {
                        query: {offset: 1, limit: 3},
                        props: ['alpha', 'beta', 'gamma']
                    });
                    this.api[method]('/foo', {
                        query: {offset: 1, limit: 3},
                        props: ['alpha', 'beta', 'gamma']
                    });
                    this.clock.tick();
                    this.http.request.calledWith(method.toUpperCase(), '/foo?offset=1&limit=3&props=alpha%2Cbeta%2Cgamma').should.be.true;
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

            [
                'post',
                'put',
                'patch',
                'delete'
            ].forEach(function(method) {
                this.http.mock(method.toUpperCase(), '/cacheable').resolvesWith({
                    $httpStatus: 200
                });
            }.bind(this));

            this.http.mock('GET', '/cacheable', {
                query: { foo: 'foo', bar: 'bar' }
            }).resolvesWith({
                foo: 'test cacheable',
                $expires: 5000,
                $id: '/cacheable'
            });

            this.http.mock('GET', '/cacheable', {
                query: { foo: 'changed', bar: 'bar' }
            }).resolvesWith({
                foo: 'test cacheable',
                $expires: 5000,
                $id: '/cacheable'
            });

            this.complexCacheable = {
                name: 'Joe',
                photo: { url: 'joe.jpg' },
                children: [
                    {
                        name: 'Jane',
                        photo: { url: 'jane.jpg' },
                        children: [
                            { name: 'Bobby', photo: { url: 'bobby.jpg' }, children: [] },
                            { name: 'Timmy', photo: { url: 'timmy.jpg' }, children: [] },
                            { name: 'Sally', photo: { url: 'sally.jpg' }, children: [] },
                        ]
                    },
                    {
                        name: 'Fred',
                        photo: { url: 'fred.jpg' },
                        children: [
                            { name: 'Alice', photo: { url: 'Alice.jpg' }, children: [] },
                            { name: 'Megatron', photo: { url: 'megatron.png' }, children: [] },
                            { name: 'Daria', photo: { url: 'daria.jpg' }, children: [] },
                        ]
                    }
                ],
                $expires: 5000,
                $id: '/complex-cacheable'
            };
            this.http.mock('GET', '/complex-cacheable').resolvesWith(this.complexCacheable);

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

        it('returns cached value if resource is cacheable, within time limit, and requested properties exist in the cache', function() {
            var promise = this.api.get('/cacheable');
            this.clock.tick();

            return promise.then(function(result1) {
                return this.api.get('/cacheable', {
                    props: ['foo']
                })
                .then(function(result2) {
                    this.http.request.calledOnce.should.be.true;
                    result1.should.deep.equal(result2);
                }.bind(this));
            }.bind(this));
        });

        [
            'post',
            'put',
            'patch',
            'delete'
        ].forEach(function(method) {
            it('removes cached value if resource updated via ' + method, function() {
                var promise = this.api.get('/cacheable');
                this.clock.tick();

                return promise.then(function(result1) {
                    this.http.request.calledOnce.should.be.true;
                    // Change the resource
                    var promise2 = this.api[method]('/cacheable');
                    this.clock.tick();
                    this.http.request.calledTwice.should.be.true;
                    // Try to GET it again -- should be a cache miss
                    this.api.get('/cacheable');
                    this.clock.tick();
                    this.http.request.calledThrice.should.be.true;
                }.bind(this));
            });
        });

        [
            ['name'],
            ['photo.url'],
            ['children@name'],
            ['children@photo.url'],
            ['children@children@name']
        ].forEach(function(props) {
            it('returns cached value if resource is cacheable, within time limit, and contains requested properties ' + props.join(','), function() {
                // Get the whole object
                var promise = this.api.get('/complex-cacheable');
                this.clock.tick();

                return promise.then(function(result1) {
                    return this.api.get('/complex-cacheable', {
                        props: props
                    })
                    .then(function(result2) {
                        this.http.request.calledOnce.should.be.true;
                        result1.should.deep.equal(result2);
                    }.bind(this));
                }.bind(this));
            });
        });

        [
            ['age'],
            ['photo.timestamp'],
            ['children@age'],
            ['children@photo.caption'],
            ['children@children@age'],
            ['name', 'photo.url', 'children@name', 'children@photo.url', 'children@children@name', 'children@children@age']
        ].forEach(function(props) {
            it('makes new http request if cached resource does not contain requested prop(s) ' + props.join(','), function() {
                this.http.mock('GET', '/complex-cacheable', {
                    props: props
                }).resolvesWith(this.complexCacheable);

                // Get the whole object
                var promise = this.api.get('/complex-cacheable');
                this.clock.tick();

                return promise.then(function(result1) {
                    var promise2 = this.api.get('/complex-cacheable', {
                        props: props
                    });
                    this.clock.tick();
                    return promise2;
                }.bind(this))
                .then(function(result2) {
                    this.http.request.calledTwice.should.be.true;
                }.bind(this));
            });
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

        it('makes new http request if query changes', function() {
            var promise1 = this.api.get('/cacheable', {
                query: { foo: 'foo', bar: 'bar' }
            });
            this.clock.tick();

            return promise1.then(function(result1) {
                this.clock.tick();
                var promise2 = this.api.get('/cacheable', {
                    query: { foo: 'changed', bar: 'bar' }
                });
                this.clock.tick();

                return promise2.then(function(result2) {
                    this.http.request.calledTwice.should.be.true;
                }.bind(this));
            }.bind(this));
        });

        it('makes new http request if query params are added', function() {
            var promise1 = this.api.get('/cacheable');
            this.clock.tick();

            return promise1.then(function(result1) {
                this.clock.tick();
                var promise2 = this.api.get('/cacheable', {
                    query: { foo: 'foo', bar: 'bar' }
                });
                this.clock.tick();

                return promise2.then(function(result2) {
                    this.http.request.calledTwice.should.be.true;
                }.bind(this));
            }.bind(this));
        });

        it('makes new http request if query params are removed', function() {
            var promise1 = this.api.get('/cacheable', {
                query: { foo: 'foo', bar: 'bar' }
            });
            this.clock.tick();

            return promise1.then(function(result1) {
                this.clock.tick();
                var promise2 = this.api.get('/cacheable');
                this.clock.tick();

                return promise2.then(function(result2) {
                    this.http.request.calledTwice.should.be.true;
                }.bind(this));
            }.bind(this));
        });

        it('does not make new http request if query order changes', function() {
            var promise1 = this.api.get('/cacheable', {
                query: { foo: 'foo', bar: 'bar' }
            });
            this.clock.tick();

            return promise1.then(function(result1) {
                this.clock.tick();
                var promise2 = this.api.get('/cacheable', {
                    query: { bar: 'bar', foo: 'foo' }
                });
                this.clock.tick();

                return promise2.then(function(result2) {
                    this.http.request.calledOnce.should.be.true;
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

        describe('collections', function() {
            beforeEach(function() {
                // First GET
                this.http.mock('GET', '/collection').resolvesWith({
                    items: [
                        { $id: '/collection/1', foo: 'test foo 1' },
                        { $id: '/collection/2', foo: 'test foo 2' },
                        { $id: '/collection/3', foo: 'test foo 3' }
                    ],
                    $type: 'collection',
                    $etag: 'W/"17f4d23c4678a6eba466f8ab7d1401ac8b8b0f89c04f7f0f836552f073728726"',
                    $expires: 5000,
                    $id: '/collection'
                });
            });

            it('passes etag on 2nd request to validate cached collection', function() {
                var promise1 = this.api.get('/collection');
                this.clock.tick();

                return promise1.then(function(result1) {
                    // Second GET
                    this.http.mock('GET', '/collection', {/* options */}, {
                        'if-none-match': 'W/"17f4d23c4678a6eba466f8ab7d1401ac8b8b0f89c04f7f0f836552f073728726"'
                    }).resolvesWith({
                        $httpStatus: 304
                    });

                    var promise2 = this.api.get('/collection');
                    this.clock.tick();

                    return promise2.then(function(result2) {
                        this.http.request.calledTwice.should.be.true;
                    }.bind(this));
                }.bind(this));
            });

            it('resolves with cached copy if etag validates', function() {
                var promise1 = this.api.get('/collection');
                this.clock.tick();

                return promise1.then(function(result1) {
                    // Second GET
                    this.http.mock('GET', '/collection', {/* options */}, {
                        'if-none-match': 'W/"17f4d23c4678a6eba466f8ab7d1401ac8b8b0f89c04f7f0f836552f073728726"'
                    }).rejectsWith({
                        $httpStatus: 304
                    });

                    var promise2 = this.api.get('/collection');
                    this.clock.tick();

                    return promise2.then(function(result2) {
                        result2.items.should.deep.equal(result1.items);
                    }.bind(this));
                }.bind(this));
            });

            it('resolves with updated object if cached', function() {
                var promise1 = this.api.get('/collection');
                this.clock.tick();

                return promise1.then(function(result1) {
                    // Second GET
                    this.http.mock('GET', '/collection', {/* options */}, {
                        'if-none-match': 'W/"17f4d23c4678a6eba466f8ab7d1401ac8b8b0f89c04f7f0f836552f073728726"'
                    }).resolvesWith({
                        $httpStatus: 200,
                        items: [
                            { $id: '/collection/4', foo: 'test foo 4' },
                            { $id: '/collection/5', foo: 'test foo 5' },
                            { $id: '/collection/6', foo: 'test foo 6' }
                        ],
                        $type: 'collection',
                        $etag: 'W/"updated"',
                        $expires: 5000,
                        $id: '/collection'
                    });

                    var promise2 = this.api.get('/collection');
                    this.clock.tick();

                    promise2.then(function(result2) {
                        result2.should.not.deep.equal(result1);
                        result2.should.have.property('items');
                        result2.items[0].should.have.property('$id', '/collection/4');
                        result2.items[1].should.have.property('$id', '/collection/5');
                        result2.items[2].should.have.property('$id', '/collection/6');
                    }.bind(this));
                }.bind(this));
            });

            it('is supported when batching', function() {
                var promise1 = this.api.get('/collection');
                this.clock.tick();

                return promise1.then(function(result1) {
                    // Second GET
                    this.http.mock('POST', '/_batch', {
                        body: [
                            { method: 'get', 'url': '/collection', 'headers': { 'if-none-match': 'W/"17f4d23c4678a6eba466f8ab7d1401ac8b8b0f89c04f7f0f836552f073728726"' }, options: {} },
                            { method: 'get', 'url': '/anything', 'headers': {}, options: {} },
                        ]
                    }).resolvesWith([
                        {
                            status: 304,
                            body: {
                                $httpStatus: 304
                            }
                        },
                        {
                            status: 200,
                            body: {
                                foo: 'anything'
                            }
                        }
                    ]);

                    var promise2 = this.api.get('/collection');

                    // Throw in a second GET to force it to batch
                    this.api.get('/anything');

                    this.clock.tick();

                    return promise2.then(function(result2) {
                        result2.should.have.property('items');
                        result2.items[0].should.have.property('$id', '/collection/1');
                        result2.items[1].should.have.property('$id', '/collection/2');
                        result2.items[2].should.have.property('$id', '/collection/3');
                    }.bind(this));
                }.bind(this));
            });

            it('will make separate api calls if batching is disabled', function() {
                // Setup: disable batching for this api instance
                // and mock the expected API endpoints (Should call those instead of POST /_batch)
                this.api.disableBatching();

                this.http.mock('GET', '/firstthing').resolvesWith({foo: '1thing'});
                this.http.mock('GET', '/anything').resolvesWith({bar: 'otherThing'});

                // Make two API calls before the clock tick finishes
                var promise1 = this.api.get('/firstthing');
                var promise2 = this.api.get('/anything');
                this.clock.tick();

                return Promise.all([promise1, promise2]).then(function(results) {
                    var result1 = results[0];
                    var result2 = results[1];
                    result1.should.have.property('foo', '1thing');
                    result2.should.have.property('bar', 'otherThing');
                }.bind(this));
            });
        });
    });

    describe('multiple calls', function() {
        beforeEach(function() {
            this.http.mock('POST', '/_batch', {
                body: [
                    { method: 'get', 'url': '/foo?props=foo%2Cbar', 'headers': {}, options: { props: ['foo', 'bar'] } },
                    { method: 'get', 'url': '/bar', 'headers': {}, options: {} }
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
                    { method: 'get', 'url': '/resolved', 'headers': {}, options: {} },
                    { method: 'get', 'url': '/rejected', 'headers': {}, options: {} }
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
            var promise1 = this.api.get('/foo', { props: ['foo', 'bar' ]});
            var promise2 = this.api.get('/bar');
            this.clock.tick();
            return Promise.all([
                promise1,
                promise2
            ]).then(function(results) {
                this.http.request.calledWith('POST', '/_batch').should.be.true;
            }.bind(this));
        });

        it('wraps each call in an envelope', function() {
            var promise1 = this.api.get('/foo', { props: ['foo', 'bar' ]});
            var promise2 = this.api.get('/bar');
            this.clock.tick();
            return Promise.all([
                promise1,
                promise2
            ]).then(function(results) {
                var body = this.http.request.lastCall.args[2].body;
                body.should.be.an('array');
                body.should.have.lengthOf(2);
                body[0].should.be.an('object');
                body[0].should.contain({
                    method: 'get',
                    url: '/foo?props=foo%2Cbar'
                });
            }.bind(this));
        });

        it('resolves each promise independently', function() {
            var promise1 = this.api.get('/foo', { props: ['foo', 'bar' ]});
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

        it('batches calls with bodies', function() {
            this.http.mockAny([
                { status: 200, body: {}},
                { status: 200, body: {}}
            ]);

            var promise1 = this.api.patch('/foo', {
                body: {
                    foo: 'test foo'
                }
            });
            var promise2 = this.api.patch('/bar', {
                body: {
                    bar: 'test bar'
                }
            });

            this.clock.tick();

            return Promise.all([
                promise1,
                promise2
            ]).then(function(results) {
                var envelopes = this.http.request.lastCall.args[2].body;
                envelopes.should.be.an('array');
                envelopes.should.have.lengthOf(2);
                envelopes[0].should.be.an('object');
                envelopes[0].should.have.property('body');
                envelopes[0].body.should.contain({
                    foo: 'test foo'
                });
            }.bind(this))
            .catch(function(error) {
                console.log('error', error);
                return Promise.reject(error);
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
