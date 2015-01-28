module.exports = {
    where : function(description, conditions, params) {
        if (!conditions) {
            return '';
        }
        var sql = [];
        for (var field in conditions) {
            if (description[field]) {
                sql.push(description[field](conditions[field], params));
            }
        }
        return sql.length == 0 ? '' : ' WHERE ' + sql.join(' AND ');
    },

    createEqual : function(conditions, description) {
        for (var i = 0; i < description.fields.length; i++) {
            (function(field) {
                conditions[field] = function(value, params) {
                    return '"' + description.table + '"."' + field + '"=$' + params.push(value);
                }
            })(description.fields[i]);
        }
    }
};