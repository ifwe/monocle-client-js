/*jshint expr: true*/
var Store = require(LIB_DIR + '/cache/store');

describe('Store', function() {
    beforeEach(function() {
        this.mockBackend = {
            get: function() {}
        };
        sinon.stub(this.mockBackend, 'get')
        .withArgs('test_cache_key_1').returns('test_cache_value_1')
        .withArgs('test_cache_key_2').returns('test_cache_value_2');;

        this.store = new Store(this.mockBackend);
    });

    it('can get items from the provided backend', function() {
        this.store.get('test_cache_key_1').should.equal('test_cache_value_1');
        this.store.get('test_cache_key_2').should.equal('test_cache_value_2');
    });
});
