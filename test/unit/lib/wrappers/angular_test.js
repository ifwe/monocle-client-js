/*jshint expr: true*/
var wrapper = require(LIB_DIR + '/wrappers/angular');

describe('Angular Wrapper', function() {
    beforeEach(function() {
        this.providers = {};
        this.module = {
            provider: sinon.spy(function(name, provider) {
                this.providers[name] = provider;
            }.bind(this))
        };

        this.angular = {
            module: sinon.spy(function() {
                return this.module;
            }.bind(this))
        };

        this.Monocle = sinon.spy();
        this.Monocle.prototype.setBase = sinon.spy();
        this.Monocle.AngularAdapter = sinon.spy();
        this.Monocle.AngularAdapter.prototype.setTimeout = sinon.spy();
        this.Monocle.AngularAdapter.prototype.setHeaders = sinon.spy();

        wrapper(this.angular, this.Monocle);
    });

    it('registers module "tagged.service.api"', function() {
        this.angular.module.calledOnce.should.be.true;
        this.angular.module.lastCall.args[0].should.equal('monocle');
    });

    it('registers provider "monocle"', function() {
        this.module.provider.calledWith('monocle').should.be.true;
    });

    describe('$get()', function() {
        it('returns a new Monocle instance', function() {
            var $http = {};
            var $q = {};
            var $window = {};
            var provider = new (this.providers.monocle)();
            var api = provider.$get($http, $q, $window);
            api.should.be.instanceOf(this.Monocle);
        });

        it('injects an instance of the Angular adapter', function() {
            var $http = {};
            var $q = {};
            var $window = {};
            var provider = new (this.providers.monocle)();
            var api = provider.$get($http, $q, $window);
            this.Monocle.lastCall.args[0].should.be.instanceOf(this.Monocle.AngularAdapter);
        });

        it('sets base path', function() {
            var $http = {};
            var $q = {};
            var $window = {};
            var provider = new (this.providers.monocle)();
            provider.setBase('/test');
            var api = provider.$get($http, $q, $window);
            this.Monocle.prototype.setBase.calledWith('/test').should.be.true;
        });
    });
});
