var Field = require('../field');

module.exports = function(Instance) {
    Instance.prototype.count = function(where) {
        return this.selectOne(where, { fields : [ new Field.Count() ] }).then(function(result) { return result.count; });
    };
};