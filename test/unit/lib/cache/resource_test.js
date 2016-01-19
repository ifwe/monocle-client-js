/*jshint expr: true*/
var ResourceCache = require(LIB_DIR + '/cache/resource');

describe('Resource Cache', function() {
    beforeEach(function() {
        this.clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        this.clock.restore();
    });

    it('is a constructor', function() {
        var cache = new ResourceCache('my_cache');
    });

    describe('basic behavior', function() {
        beforeEach(function() {
            this.cache = new ResourceCache('my_cache');
        });

        it('doesn\'t put in objects that don\'t have $id property', function() {
            var fakeResource = {
                $expires: 1000,
                value: ''
            };
            var cacheKey = this.cache.put(fakeResource);
            expect(cacheKey).to.be.undefined;
        });

        it('doesn\'t put in objects that don\'t have $expires property', function() {
            var fakeResource = {
                $id: 1000,
                value: ''
            };
            var cacheKey = this.cache.put(fakeResource);
            expect(cacheKey).to.be.undefined;
        });

        it('can put and get', function() {
            var resource = {
                $id: 'test_key',
                $expires: 1000,
                value: 'test'
            };
            expect(this.cache.get(resource.$id)).to.be.undefined;
            var cacheKey = this.cache.put(resource);
            this.cache.get(cacheKey).should.deep.equal(resource);
        });

        it('can remove a single entry', function() {
            var resource = {
                $id: 'test_key',
                $expires: 1000,
                value: 'test'
            };
            var cacheKey = this.cache.put(resource);
            this.cache.get(cacheKey).should.deep.equal(resource);
            this.cache.remove(cacheKey);
            expect(this.cache.get(cacheKey)).to.be.undefined;
        });

        it('can remove all', function() {
            var resource = {
                $id: 'test_key',
                $expires: 1000,
                value: 'test'
            };
            var resource2 = {
                $id: 'test_key2',
                $expires: 1000,
                value: 'test2'
            };
            var cacheKey = this.cache.put(resource);
            var cacheKey2 = this.cache.put(resource2);
            this.cache.removeAll();
            expect(this.cache.get(cacheKey)).to.be.undefined;
            expect(this.cache.get(cacheKey2)).to.be.undefined;
        });

        it('can get all', function() {
            var resource = {
                $id: 'test_key',
                $expires: null,
                value: 'test'
            };
            var resource2 = {
                $id: 'test_key2',
                $expires: 1000,
                value: 'test2'
            };
            var cacheKey = this.cache.put(resource);
            var cacheKey2 = this.cache.put(resource2);
            var all = this.cache.getAll();
            all.should.be.an('object');
            all.should.have.property(cacheKey);
            all.should.have.property(cacheKey2);
        });
    });

    describe('expiration', function() {
        beforeEach(function() {
            this.cache = new ResourceCache('my_cache');
        });

        it('get returns undefined for expired entry', function() {
            var resource = {
                $id: 'test_key',
                $expires: 100, // expires in 100ms
                value: 'test'
            };
            var cacheKey = this.cache.put(resource);
            this.cache.get(cacheKey).should.deep.equal(resource);
            this.clock.tick(100);
            this.cache.get(cacheKey).should.deep.equal(resource);
            this.clock.tick(1);
            expect(this.cache.get(cacheKey)).to.be.undefined;
        });

        [
            -1,
            -1000,
            'foo',
            null,
            undefined,
            true,
            false
        ].forEach(function(ttl) {
            it('ignores invalid ttl ' + ttl, function() {
                var resource = {
                    $id: 'test_key',
                    $expires: ttl,
                    value: 'test'
                };

                var cacheKey = this.cache.put(resource);
                this.cache.get(cacheKey).should.deep.equal(resource);
                this.clock.tick(10000000);
                this.cache.get(cacheKey).should.deep.equal(resource);
            });
        });
    });

    describe('tags', function() {
        beforeEach(function() {
            this.cache = new ResourceCache('my_cache', {
                capacity: 10
            });
        });

        it('can be removed by resource name', function() {
            var resource = {
                $id: 'test_key_1',
                $expires: null,
                value: 'test'
            };
             var resource2 = {
                $id: 'test_key_2',
                $expires: null,
                value: 'test'
            };
            var cacheKey1 = this.cache.put(resource, { foo: 'foo' }); // single tag
            var cacheKey2 = this.cache.put(resource, { foo: 'bar' }); // multiple tags
            var cacheKey3 = this.cache.put(resource2, { foo: 'foo' });
            var cacheKey4 = this.cache.put(resource2, { foo: 'bar' });

            this.cache.removeMatchingTag('test_key_1');

            expect(this.cache.get(cacheKey1)).to.be.undefined;
            expect(this.cache.get(cacheKey2)).to.be.undefined;
            this.cache.get(cacheKey3).should.deep.equal(resource2);
            this.cache.get(cacheKey4).should.deep.equal(resource2);
        });
    });

    describe('nested resources', function() {
        beforeEach(function() {
            this.cache = new ResourceCache('my_cache', {
                capacity: 10
            });
        });

        it('caches a nested resource', function() {
            var nestedResource = {
                $id: 'nested',
                $expires: null,
                testProp: 'test'
            };
            var resource = {
                $id: 'test_key',
                $expires: null,
                prop1: 'test',
                prop2: nestedResource
            };

            var cacheKey = this.cache.put(resource);
            this.cache.get(cacheKey).should.deep.equal(resource);
            this.cache.get('nested').should.deep.equal(nestedResource);
        });

        it('caches deeply nested resources', function() {
            var deeplyNestedResource = {
                $id: 'deeply',
                $expires: null,
                val: 'deeply nested'
            };
            var nestedResource = {
                $id: 'nested',
                $expires: null,
                testProp: 'test',
                valNested: deeplyNestedResource
            };
            var nestedResource2 = {
                $id: '3_1',
                $expires: null,
                val: '3_1'
            };
            var resource = {
                $id: 'test_key',
                $expires: null,
                prop1: 'test',
                prop2: nestedResource,
                prop3: {
                    prop3_1: nestedResource2
                }
            };

            var cacheKey = this.cache.put(resource);
            this.cache.get(cacheKey).should.deep.equal(resource);
            this.cache.get('nested').should.deep.equal(nestedResource);
            this.cache.get('deeply').should.deep.equal(deeplyNestedResource);
            this.cache.get('3_1').should.deep.equal(nestedResource2);
        });

        it('gets undefined for parent of expired deeply nested resource', function() {
            var nestedResource = {
                $id: 'nested',
                $expires: 100,
                val: '1'
            };
            var nestedResource2 = {
                $id: 'nested2',
                $expires: 200,
                val: '2'
            };
            var resource = {
                $id: 'root',
                $expires: null,
                val1: nestedResource,
                val2: nestedResource2
            };

            // Everything cached to start.
            var cacheKey = this.cache.put(resource);
            this.cache.get(cacheKey).should.deep.equal(resource);
            this.cache.get('nested').should.deep.equal(nestedResource);
            this.cache.get('nested2').should.deep.equal(nestedResource2);

            // Just before first nested resource expires, everything is cached.
            this.clock.tick(100);
            this.cache.get(cacheKey).should.deep.equal(resource);
            this.cache.get('nested').should.deep.equal(nestedResource);
            this.cache.get('nested2').should.deep.equal(nestedResource2);

            // First nested resource expired, root resource and first nested resource should not be in cache.
            this.clock.tick(1);
            expect(this.cache.get(cacheKey)).to.be.undefined;
            expect(this.cache.get('nested')).to.be.undefined;
            this.cache.get('nested2').should.deep.equal(nestedResource2);

            // Just before second nested resource expires, second nested resource should still be cached.
            this.clock.tick(99);
            expect(this.cache.get(cacheKey)).to.be.undefined;
            expect(this.cache.get('nested')).to.be.undefined;
            this.cache.get('nested2').should.deep.equal(nestedResource2);

            // Second nested resource expired, nothing should be in cache anymore.
            this.clock.tick(1);
            expect(this.cache.get(cacheKey)).to.be.undefined;
            expect(this.cache.get('nested')).to.be.undefined;
            expect(this.cache.get('nested2')).to.be.undefined;
        });
    });
});
