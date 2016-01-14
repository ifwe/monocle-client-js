var sha256 = require('tiny-sha256');

/**
 * Given a collection and request details,
 * determines a "weak" etag.
 */
var CollectionCache = function(collection, props, query) {
    this.collection = collection;
    this.props = props;
    this.query = query;
};

/**
 * Generates a "weak" etag for the collection.
 * Returns `false` if a weak etag cannot be created.
 *
 * @returns string|false - Weak etag
 */
CollectionCache.prototype.id = function() {
    if (this.collection.$type !== 'collection' || !this.collection.$id || !this.collection.$expires) {
        return false;
    }

    var hasMissingIdentity = false;
    var items = this.collection.items;

    // 1. Gather resource IDs in collection
    var resourceIds = items.map(function(item) {
        if (item.$link) {
            return item.$link;
        }

        if (item.$id) {
            return item.$id;
        }

        // Item has no identity
        hasMissingIdentity = true;
    });

    if (hasMissingIdentity) {
        // Cannot create an etag if identities are missing
        return false;
    }

    // 2. Gather requested props, alphabetized
    var props = [].concat(this.props || []).sort();

    // 3. Gather all other query string parameters
    var query = (this.query || '')
    .replace(/^\?/, '')             // remove "?" from beginning of string
    .split('&')                     // create array of keyvalue parts
    .filter(function(keyvalue) {    // filter out "props" query string param
        if (!keyvalue) return false;
        return !keyvalue.match(/^props=/)
    })
    .sort();                        // sort alphabetically

    // 4. Generate a string of metadata
    var metadataString = JSON.stringify([
        resourceIds,
        props,
        query
    ]);

    // 5. Generate a sha256 hash of the metadata
    var sha256Hash = sha256(metadataString);

    // 6. Make a weak etag
    return 'W/"' + sha256Hash + '"';
};

module.exports = CollectionCache;
