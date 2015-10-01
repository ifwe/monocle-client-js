/*jshint expr: true*/
var Monocle = require(LIB_DIR + '/monocle');
var HttpMock = require('./mocks/http.js');

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
                    this.http.request.calledWith(method.toUpperCase(), '/foo').should.be.true;
                });

                it('prepends base path if provided', function() {
                    this.api.setBase('/my-base');
                    this.http.mock(method, '/my-base/foo');
                    this.api[method]('/foo');
                    this.http.request.calledWith(method.toUpperCase(), '/my-base/foo').should.be.true;
                });

                it('appends props as a query string parameter', function() {
                    this.http.mock(method, '/foo', {
                        props: ['alpha', 'beta', 'gamma']
                    });
                    this.api[method]('/foo', {
                        props: ['alpha', 'beta', 'gamma']
                    });
                    this.http.request.calledWith(method.toUpperCase(), '/foo?props=alpha%2Cbeta%2Cgamma').should.be.true;
                });

                it('resolves with value from successful HTTP call', function() {
                    this.http.mock(method, '/foo').resolvesWith({ foo: 'test foo' });

                    return this.api[method]('/foo')
                    .then(function(result) {
                        result.should.deep.equal({
                            foo: 'test foo'
                        });
                    }.bind(this));
                });

                it('rejects with error from unsuccessful HTTP call', function() {
                    this.http.mock(method, '/foo').rejectsWith('test error');

                    return this.api[method]('/foo')
                    .then(function(result) {
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
            return this.api.get('/cacheable')
            .then(function(result1) {
                return this.api.get('/cacheable')
                .then(function(result2) {
                    this.http.request.calledOnce.should.be.true;
                    result1.should.equal(result2);
                }.bind(this));
            }.bind(this));
        });

        it('makes new http request if cached resource is expired', function() {
            return this.api.get('/cacheable')
            .then(function(result1) {
                this.clock.tick(5001);
                return this.api.get('/cacheable')
                .then(function(result2) {
                    this.http.request.calledTwice.should.be.true;
                    result1.should.equal(result2);
                }.bind(this));
            }.bind(this));
        });

        it('makes new http request if resource is not cacheable', function() {
            return this.api.get('/uncacheable')
            .then(function(result1) {
                return this.api.get('/uncacheable')
                .then(function(result2) {
                    this.http.request.calledTwice.should.be.true;
                    result1.should.equal(result2);
                }.bind(this));
            }.bind(this));
        });
    });
});
