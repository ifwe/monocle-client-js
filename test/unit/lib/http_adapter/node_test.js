/*jshint expr: true*/
var Http = require(LIB_DIR + '/http_adapter/node');
var request = require('request');
var Promise = require('bluebird');

describe('Node HTTP Adapter', function() {
    beforeEach(function() {
        this.request = request;
        this.http = new Http(this.request);
    });

    it('exists', function() {
        Http.should.be.ok;
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
                this.http.request(method, this.path, this.options, this.body);
                this.request[methodAsync].calledOnce.should.be.true;
                this.request[methodAsync].lastCall.args[0].should.have.property('url', this.path);
            });

            it('sets content-type header', function() {
                var expectedContentType = 'application/x-www-form-urlencoded; charset=UTF-8';
                this.http.request(method, this.path, this.options, this.body);
                this.request[methodAsync].calledOnce.should.be.true;
                this.request[methodAsync].lastCall.args[0].should.have.property('headers');
                this.request[methodAsync].lastCall.args[0].headers.should.have.property('Content-Type', expectedContentType);
            });

            it('resolves with response', function() {
                this.request[methodAsync].returns(Promise.resolve([{ foo: 'test foo' }]));

                return this.http.request(method, this.path, this.options, this.body)
                .then(function(result) {
                    result.should.deep.equal({ foo: 'test foo' });
                });
            });

            it('rejects with error', function() {
                this.request[methodAsync].returns(Promise.reject('test error'));

                return this.http.request(method, this.path, this.options, this.body)
                .then(function(result) {
                    throw new Error('did not expect success handler to be called');
                })
                .catch(function(error) {
                    error.should.equal('test error');
                });
            });

            describe('timeout', function() {
                it('defaults to 30s', function() {
                    this.http.request(method, this.path, this.options, this.body);
                    this.request[methodAsync].lastCall.args[0].should.contain({
                        timeout: 30000
                    });
                });

                it('can be overwritten', function() {
                    this.http.setTimeout(5000);
                    this.http.request(method, this.path, this.options, this.body);
                    this.request[methodAsync].lastCall.args[0].should.contain({
                        timeout: 5000
                    });
                });
            });
        });
    });
});
