/*jshint expr: true*/
var wrapper = require(LIB_DIR + '/wrappers/angular');
var AngularAdapter = require(LIB_DIR + '/http_adapter/angular');

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
        this.Monocle.prototype.disableBatching = sinon.spy();
        this.Monocle.prototype.enableBatching = sinon.spy();

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
            this.Monocle.lastCall.args[0].should.be.instanceOf(AngularAdapter);
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

        it('does not disable batching by default', function() {
            var $http = {};
            var $q = {};
            var $window = {};
            var provider = new (this.providers.monocle)();
            var api = provider.$get($http, $q, $window);
            this.Monocle.prototype.enableBatching.called.should.be.false;
            this.Monocle.prototype.disableBatching.called.should.be.false;
        });

        it('can en batching', function() {
            var $http = {};
            var $q = {};
            var $window = {};
            var provider = new (this.providers.monocle)();
            provider.disableBatching();
            var api = provider.$get($http, $q, $window);
            this.Monocle.prototype.enableBatching.called.should.be.false;
            this.Monocle.prototype.disableBatching.called.should.be.true;
        });

        it('can disable batching', function() {
            var $http = {};
            var $q = {};
            var $window = {};
            var provider = new (this.providers.monocle)();
            provider.disableBatching();
            var api = provider.$get($http, $q, $window);
            this.Monocle.prototype.enableBatching.called.should.be.false;
            this.Monocle.prototype.disableBatching.called.should.be.true;
        });

        it('can disable and re-enable batching', function() {
            var $http = {};
            var $q = {};
            var $window = {};
            var provider = new (this.providers.monocle)();
            provider.disableBatching();
            provider.enableBatching();
            var api = provider.$get($http, $q, $window);
            this.Monocle.prototype.enableBatching.called.should.be.false;
            this.Monocle.prototype.disableBatching.called.should.be.false;
        });
    });
});
