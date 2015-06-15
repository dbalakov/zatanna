module.exports = {
    where : function(description, conditions, params) {
        if (!conditions) {
            return '';
        }
        var sql = [];
        for (var field in conditions) {
            if (typeof conditions[field] === 'undefined') { continue; }

            if (description[field]) {
                var value = description[field](conditions[field], params);
                if (value != null && value != undefined) {
                    sql.push(value);
                }
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