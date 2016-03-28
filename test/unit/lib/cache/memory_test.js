/*jshint expr: true*/
var MemoryCache = require(LIB_DIR + '/cache/memory');

describe('Memory Cache', function() {
    beforeEach(function() {
        this.clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        this.clock.restore();
    });

    it('is a constructor', function() {
        var cache = new MemoryCache('my_cache');
    });

    describe('basic behavior', function() {
        beforeEach(function() {
            this.cache = new MemoryCache('my_cache');
        });

        it('can put and get', function() {
            expect(this.cache.get('test_key')).to.be.undefined;
            this.cache.put('test_key', 42);
            this.cache.get('test_key').should.equal(42);
        });

        it('can remove a single entry', function() {
            this.cache.put('test_key', 42);
            this.cache.get('test_key').should.equal(42);
            this.cache.remove('test_key');
            expect(this.cache.get('test_key')).to.be.undefined;
        });

        it('can remove all', function() {
            this.cache.put('test_key_1', 42);
            this.cache.put('test_key_2', 84);
            this.cache.removeAll();
            expect(this.cache.get('test_key_1')).to.be.undefined;
            expect(this.cache.get('test_key_2')).to.be.undefined;
        });

        it('can get all', function() {
            this.cache.put('test_key_1', 42);
            this.cache.put('test_key_2', 84, 1000);
            var all = this.cache.getAll();
            all.should.be.an('object');
            all.should.have.property('test_key_1');
            all.should.have.property('test_key_2');

            all.test_key_1.should.have.property('value', 42);
            all.test_key_1.should.have.property('expiration', false);

            all.test_key_2.should.have.property('value', 84);
            all.test_key_2.should.have.property('expiration');
            all.test_key_2.expiration.should.be.a('date');
            all.test_key_2.expiration.should.eql(new Date(1000)); // loose comparison check
        });
    });

    describe('expiration', function() {
        beforeEach(function() {
            this.cache = new MemoryCache('my_cache');
        });

        it('get returns undefined for expired entry', function() {
            this.cache.put('test_key', 42, 100); // expires in 100ms
            this.cache.get('test_key').should.equal(42);
            this.clock.tick(100);
            this.cache.get('test_key').should.equal(42);
            this.clock.tick(1);
            expect(this.cache.get('test_key')).to.be.undefined;
        });

        it('get returns undefined for entry with expired being 0', function() {
            this.cache.put('test_key', 42, 0);
            this.cache.get('test_key').should.equal(42);
            this.clock.tick(1);
            expect(this.cache.get('test_key')).to.be.undefined;
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
            it('ignores invalid ttl ' + JSON.stringify(ttl), function() {
                this.cache.put('test_key', 42, ttl);
                expect(this.cache.get('test_key')).to.equal(42);
                this.clock.tick(10000000);
                expect(this.cache.get('test_key')).to.equal(42);
            });
        });
    });

    describe('lru with expiration', function() {
        beforeEach(function() {
            this.cache = new MemoryCache('my_cache', {
                capacity: 3
            });
        });

        it('removes least recently used entry', function() {
            this.cache.put('a', 'test a'); // no expiration
            this.cache.put('b', 'test b'); // no expiration
            this.cache.put('c', 'test c'); // newest entry, but expires soon
            expect(this.cache.printFromHead()).to.equal('c > b > a');
            expect(this.cache.printFromTail()).to.equal('a < b < c');

            this.cache.get('a'); // access to move it up the stack
            expect(this.cache.printFromHead()).to.equal('a > c > b'); // `a` moves to the head
            expect(this.cache.printFromTail()).to.equal('b < c < a');

            this.cache.get('c'); // access to move it up the stack
            expect(this.cache.printFromHead()).to.equal('c > a > b'); // `c` moves to the head
            expect(this.cache.printFromTail()).to.equal('b < a < c');

            // force a cached entry to drop, in this case, the entry `b` because it was last to be accessed
            this.cache.put('d', 'test d');
            expect(this.cache.printFromHead()).to.equal('d > c > a'); // `d` moves to the head, `b` gets dropped from tail
            expect(this.cache.printFromTail()).to.equal('a < c < d');

            expect(this.cache.get('a')).to.equal('test a'); // still good
            expect(this.cache.get('b')).to.be.undefined; // removed because it wasn't accessed recently
            expect(this.cache.get('c')).to.equal('test c'); // still good
            expect(this.cache.get('d')).to.equal('test d'); // still good
            expect(this.cache.get('e')).to.be.undefined; // doesn't exist yet

            // push another item onto the cache, which drops 'a'
            this.cache.put('e', 'test e');
            expect(this.cache.printFromHead()).to.equal('e > d > c'); // `e` moves to the head, `a` dropped from tail
            expect(this.cache.printFromTail()).to.equal('c < d < e');

            expect(this.cache.get('a')).to.be.undefined; // dropped because it was last one to be accessed
            expect(this.cache.get('b')).to.be.undefined; // removed previously
            expect(this.cache.get('c')).to.equal('test c'); // still good
            expect(this.cache.get('d')).to.equal('test d'); // still good
            expect(this.cache.get('e')).to.equal('test e'); // still good

            expect(this.cache.printFromHead()).to.equal('e > d > c');
            expect(this.cache.printFromTail()).to.equal('c < d < e');

            expect(this.cache.get('c')).to.equal('test c'); // moves tail item `c` to the head
            expect(this.cache.printFromHead()).to.equal('c > e > d');
            expect(this.cache.printFromTail()).to.equal('d < e < c');

            expect(this.cache.get('c')).to.equal('test c'); // no change, `c` is already the head
            expect(this.cache.printFromHead()).to.equal('c > e > d');
            expect(this.cache.printFromTail()).to.equal('d < e < c');
        });

        it('removes expired entries before removing least recently used entry', function() {
            this.cache.put('a', 1); // no expiration
            this.cache.put('b', 2); // no expiration
            this.cache.put('c', 3, 100); // newest entry, but expires soon
            this.clock.tick(101);

            // force a cached entry to drop, in this case, the expired entry
            this.cache.put('d', 4);

            expect(this.cache.get('a')).to.equal(1); // still good
            expect(this.cache.get('b')).to.equal(2); // still good
            expect(this.cache.get('c')).to.be.undefined; // removed because it expired
            expect(this.cache.get('d')).to.equal(4); // still good
        });

        [
            [ 'tail', 'a', { a: undefined, b: undefined, c: 3, d: 4, e: 5} ],
            [ 'head', 'c', { a: undefined, b: 2, c: undefined, d: 4, e: 5} ],
            [ 'middle', 'b', { a: undefined, b: undefined, c: 3, d: 4, e: 5} ]
        ].forEach(function(data) {
            var entryPosition = data[0];
            var cacheKeyToRemove = data[1];
            var expectedCache = data[2];
            it('does not break LRU when ' + entryPosition + ' is removed manually', function() {
                var _this = this;
                // First fill up the cache up to the limit
                this.cache.put('a', 1);
                this.cache.put('b', 2);
                this.cache.put('c', 3);

                // Remove the specified item from the data provider
                this.cache.remove(cacheKeyToRemove);

                // Add two more items to force the LRU item to be purged
                this.cache.put('d', 4);
                this.cache.put('e', 5);

                // Assert the cache contains all the expected items
                Object.keys(expectedCache).forEach(function(key) {
                    var value = expectedCache[key];
                    expect(_this.cache.get(key)).to.equal(value);
                });
            });
        });
    });

    describe('tags', function() {
        beforeEach(function() {
            this.cache = new MemoryCache('my_cache', {
                capacity: 10
            });
        });

        it('can be removed by tag name', function() {
            this.cache.put('a', 1, null, 'foo'); // single tag
            this.cache.put('b', 2, null, ['foo', 'bar']); // multiple tags
            this.cache.put('c', 3, null, 'bar');
            this.cache.removeMatchingTag('foo');
            expect(this.cache.get('a')).to.be.undefined;
            expect(this.cache.get('b')).to.be.undefined;
            expect(this.cache.get('c')).to.equal(3);
        });
    });
});
