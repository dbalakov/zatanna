module.exports = function(Instance) {
    Instance.prototype.insert = function(obj) {
        var fields = [];
        var params = [];
        var paramsStr = [];
        for(var i = 0; i < this.description.fields.length; i++) {
            var field = this.description.fields[i];
            if (obj.hasOwnProperty(field)) {
                fields.push('"' + field + '"')
                paramsStr.push('$' + params.push(obj[field]));
            }
        }
        this.dao.executeSql('INSERT INTO "' + this.description.table + '" (' + fields.join(',') + ') VALUES (' + paramsStr.join(',') + ');', params);
    };
};