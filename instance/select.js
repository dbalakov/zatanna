var conditions = require('./conditions');
var DAO        = require('..');

module.exports = function(Instance) {
    Instance.prototype.select = function(description, where) {
        var _fields = description && description.fields ? description.fields : this.description.fields;
        var fields = [];
        for (var i = 0; i < _fields.length; i++) {
            if (_fields[i].toSQL) {
                fields.push(_fields[i]);
                continue;
            }
            fields.push('"' + this.description.table + '"."' + _fields[i] + '"');
        }

        var from = [ '"' + this.description.table + '"' ];
        if (description && description.join) {
            for (var i = 0; i < description.join.length; i++) {
                from.push(description.join[i].toSQL());
            }
        }

        var params = [];

        var fieldsPart = this.createFieldsForSelect(fields, params);
        var fromPart   = from.join(' ');
        var wherePart  = conditions.where(this.conditions, where, params);
        var orderPart  = description && description.order ? (' ORDER BY ' + description.order) : '';
        var limitPart  = description && description.limit ? (' LIMIT $' + params.push(description.limit)) : '';
        var offsetPart = description && description.offset ? (' OFFSET $' + params.push(description.offset)) : '';

        return this.dao.select('SELECT ' + fieldsPart + ' FROM ' + fromPart + ' ' + wherePart + orderPart + limitPart + offsetPart, params);
    };

    Instance.prototype.createFieldsForSelect = function(fields, params) {
        var result = [];
        for (var i = 0; i < fields.length; i++) {
            result.push(fields[i].toSQL ? fields[i].toSQL(params) : fields[i]);
        }
        return result.join(',');
    };
};