var conditions = require('./conditions');

module.exports = function(Instance) {
    Instance.prototype.delete = function(where) {
        var params = [];
        this.dao.executeSql('DELETE FROM "' + this.description.table + '" ' + conditions.where(this.conditions, where, params), params);
    };
};