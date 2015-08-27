var conditions = require('./conditions');

module.exports = function(Instance) {
    Instance.prototype.update = function(obj, where) {
        var setter = [];
        var params = [];
        for(var i = 0; i < this.description.fields.length; i++) {
            var field = createFieldDescription(this.description.fields[i]);
            if (obj.hasOwnProperty(field.name)) {
                setter.push('"' + field.name + '" = ' + field.toSQL(obj[field.name], params));
            }
        }
        
        this.dao.executeSql('UPDATE "' + this.description.table + '" SET ' + setter.join(',') + conditions.where(this.conditions, where, params), params);
    };
};

function createFieldDescription(field) {
    if (typeof(field) === 'string') {
        return {
            name  : field,
            toSQL : function(value, params) { return '$' + params.push(value); }
        }
    }
    return field;
}