'use strict';

function Resource(resourceId, data) {
    this._resourceId = resourceId;
    this.update(data);
}

Resource.prototype.getResourceId = function() {
    return this._resourceId;
};

Resource.prototype.setResourceId = function(resourceId) {
    this._resourceId = resourceId;
};

Resource.prototype.update = function(data) {
    for (var i in data) {
        // skip "private" properties
        if ('_' === i[0]) {
            continue;
        }

        this[i] = data[i];
    }
};

module.exports = Resource;
