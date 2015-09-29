var AngularAdapter = require(LIB_DIR + '/http_adapter/angular');
var Promise = context.Promise || require('bluebird');

describe('Angular Adapter', function() {
    beforeEach(function() {
        this.$http = sinon.spy(function() {
            return new Promise(function(resolve, reject) {
                this.resolve = resolve;
                this.reject = reject;
            }.bind(this));
        }.bind(this));
        this.$window = {
            location: {
                href: '/foo'
            }
        };
        this.$q = {
            reject: sinon.spy()
        };
        this.adapter = new AngularAdapter(this.$http, this.$q, this.$window);
    });

    it('is a constructor', function() {
        AngularAdapter.should.be.a('function');
    });

    describe('request()', function() {
        it('is a function', function() {
            this.adapter.request.should.be.a('function');
        });

        ['get', 'post', 'put', 'patch', 'delete'].forEach(function(method) {
            describe('with http method: ' + method, function() {
                it('makes ' + method + ' request using $http', function() {
                    this.adapter.request(method, '/foo');
                    this.$http.calledWith({
                        url: '/foo',
                        method: method.toUpperCase()
                    });
                });

                it('formats resolved ' + method + ' response', function() {
                    var result = this.adapter.request(method, '/foo');
                    this.resolve({ data:
                        { body: 'some data' }
                    });
                    return result.then(function(value) {
                        value.should.deep.equal({ body: 'some data'});
                    });
                });

                it('sets content-type header', function() {
                    this.adapter.request(method, '/foo');
                    var expectedContentType = 'application/x-www-form-urlencoded; charset=UTF-8';
                    this.$http.lastCall.args[0].headers.should.have.property('Content-Type', expectedContentType);
                });

                it('sets ajax header', function() {
                    this.adapter.request(method, '/foo');
                    this.$http.lastCall.args[0].headers.should.have.property('X-Requested-With', 'XMLHttpRequest');
                });
            });
        });
    });
});
