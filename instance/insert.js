module.exports = function(Instance) {
    Instance.prototype.insert = function(obj) {
        var fields    = [];
        var params    = [];
        var paramsStr = [];
        for(var i = 0; i < this.description.fields.length; i++) {
            var field = createFieldDescription(this.description.fields[i]);
            if (obj.hasOwnProperty(field.name)) {
                fields.push('"' + field.name + '"')
                paramsStr.push(field.toSQL(obj[field.name], params));
            }
        }
        this.dao.executeSql('INSERT INTO "' + this.description.table + '" (' + fields.join(',') + ') VALUES (' + paramsStr.join(',') + ');', params);
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