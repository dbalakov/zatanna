var conditions = require('./conditions');

module.exports = function(Instance) {
    Instance.prototype.update = function(obj, where) {
        var setter = [];
        var params = [];
        for(var i = 0; i < this.description.fields.length; i++) {
            var field = this.description.fields[i];
            if (obj.hasOwnProperty(field)) {
                setter.push('"' + field + '" = $' + params.push(obj[field]));
            }
        }
        this.dao.executeSql('UPDATE "' + this.description.table + '" SET ' + setter.join(',') + conditions.where(this.conditions, where, params), params);
    };
};