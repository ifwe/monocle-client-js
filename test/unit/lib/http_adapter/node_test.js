/*jshint expr: true*/
var NodeAdapter = require(LIB_DIR + '/http_adapter/node');
var request = require('request');
var Promise = require('bluebird');

describe('Node HTTP Adapter', function() {
    beforeEach(function() {
        this.request = request;
        this.adapter = new NodeAdapter(this.request);
    });

    it('exists', function() {
        NodeAdapter.should.be.ok;
    });

     describe('request()', function() {
        it('is a function', function() {
            this.adapter.request.should.be.a('function');
        });

        ['get', 'post', 'put', 'patch', 'delete'].forEach(function(method) {
            var methodAsync = (method === 'delete' ? 'del' : method) + 'Async';
            describe('with http method: ' + method, function() {
                beforeEach(function() {
                    this.path = '/foo';
                    this.options = undefined;
                    this.body = undefined;
                    sinon.stub(this.request, methodAsync).returns(Promise.resolve({}));
                });

                afterEach(function() {
                    this.request[methodAsync].restore();
                });

                it('makes ' + method + ' request to specified path', function() {
                    return this.adapter.request(method, this.path, this.options, this.body)
                    .then(function(result) {
                        this.request[methodAsync].calledOnce.should.be.true;
                        this.request[methodAsync].lastCall.args[0].should.have.property('url', this.path);
                    }.bind(this));
                });

                it('resolves with response', function() {
                    this.request[methodAsync].returns(Promise.resolve([{ foo: 'test foo' }]));

                    return this.adapter.request(method, this.path, this.options, this.body)
                    .then(function(result) {
                        result.should.deep.equal({ foo: 'test foo' });
                    });
                });

                it('rejects with error', function() {
                    this.request[methodAsync].returns(Promise.reject('test error'));

                    return this.adapter.request(method, this.path, this.options, this.body)
                    .then(function(result) {
                        throw new Error('did not expect success handler to be called');
                    })
                    .catch(function(error) {
                        error.should.equal('test error');
                    });
                });

                describe('timeout', function() {
                    it('defaults to 30s', function() {
                        return this.adapter.request(method, this.path, this.options, this.body)
                        .then(function(result) {
                            this.request[methodAsync].lastCall.args[0].should.contain({
                                timeout: 30000
                            });
                        }.bind(this));
                    });

                    it('can be overwritten', function() {
                        this.adapter.setTimeout(5000);
                        return this.adapter.request(method, this.path, this.options, this.body)
                        .then(function(result) {
                            this.request[methodAsync].lastCall.args[0].should.contain({
                                timeout: 5000
                            });
                        }.bind(this));
                    });
                });

                describe('headers', function() {
                    it('passes content-type header', function() {
                        var expectedContentType = 'application/x-www-form-urlencoded; charset=UTF-8';
                        return this.adapter.request(method, this.path, this.options, this.body)
                        .then(function(result) {
                            this.request[methodAsync].calledOnce.should.be.true;
                            this.request[methodAsync].lastCall.args[0].should.have.property('headers');
                            this.request[methodAsync].lastCall.args[0].headers.should.have.property('Content-Type', expectedContentType);
                        }.bind(this));
                    });

                    it('supports custom header', function() {
                        this.adapter.setHeader('x-custom-test', 'test value');
                        return this.adapter.request(method, this.path, this.options, this.body)
                        .then(function(result) {
                            this.request[methodAsync].calledOnce.should.be.true;
                            this.request[methodAsync].lastCall.args[0].should.have.property('headers');
                            this.request[methodAsync].lastCall.args[0].headers.should.have.property('x-custom-test', 'test value');
                        }.bind(this));
                    });

                    it('supports many custom headers', function() {
                        this.adapter.setHeaders({
                            'x-custom-test-1': 'test value 1',
                            'x-custom-test-2': 'test value 2',
                            'x-custom-test-3': 'test value 3'
                        });
                        return this.adapter.request(method, this.path, this.options, this.body)
                        .then(function(result) {
                            this.request[methodAsync].calledOnce.should.be.true;
                            this.request[methodAsync].lastCall.args[0].should.have.property('headers');
                            this.request[methodAsync].lastCall.args[0].headers.should.have.property('x-custom-test-1', 'test value 1');
                            this.request[methodAsync].lastCall.args[0].headers.should.have.property('x-custom-test-2', 'test value 2');
                            this.request[methodAsync].lastCall.args[0].headers.should.have.property('x-custom-test-3', 'test value 3');
                        }.bind(this));
                    });

                    it('supports callback function to generate header value', function() {
                        this.adapter.setHeader('x-custom-callback', function() {
                            return 'test value';
                        });
                        return this.adapter.request(method, this.path, this.options, this.body)
                        .then(function(result) {
                            this.request[methodAsync].calledOnce.should.be.true;
                            this.request[methodAsync].lastCall.args[0].should.have.property('headers');
                            this.request[methodAsync].lastCall.args[0].headers.should.have.property('x-custom-callback', 'test value');
                        }.bind(this));
                    });

                    it('supports promise to generate header value', function() {
                        this.adapter.setHeader('x-custom-promise', Promise.resolve('test value'));
                        return this.adapter.request(method, this.path, this.options, this.body)
                        .then(function(result) {
                            this.request[methodAsync].calledOnce.should.be.true;
                            this.request[methodAsync].lastCall.args[0].should.have.property('headers');
                            this.request[methodAsync].lastCall.args[0].headers.should.have.property('x-custom-promise', 'test value');
                        }.bind(this));
                    });

                    it('supports callback function that returns a promise to generate header value', function() {
                        this.adapter.setHeader('x-custom-callback-promise', function() {
                            return Promise.resolve('test value');
                        });
                        return this.adapter.request(method, this.path, this.options, this.body)
                        .then(function(result) {
                            this.request[methodAsync].calledOnce.should.be.true;
                            this.request[methodAsync].lastCall.args[0].should.have.property('headers');
                            this.request[methodAsync].lastCall.args[0].headers.should.have.property('x-custom-callback-promise', 'test value');
                        }.bind(this));
                    });
                });
            });
        });
    });
});
