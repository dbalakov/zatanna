var conditions = require('./conditions');
var DAO        = require('..');

module.exports = function(Instance) {
    Instance.prototype._select = function(type, where, description) {
        var _where       = where || {};
        var _description = description || {};

        _description.fields = _description.fields ? _description.fields.slice() : parseFields(this.description.fields);
        _description.join   = _description.join || [];

        if (this.selectDescription) {
            Object.keys(this.selectDescription).forEach(function (key) {
                if (_description[key] != null && _description[key] != undefined) {
                    this.selectDescription[key](where, _description, _description[key]);
                }
            }.bind(this));
        }

        var fields = [];
        for (var i = 0; i < _description.fields.length; i++) {
            if (_description.fields[i].toSQL) {
                fields.push(_description.fields[i]);
                continue;
            }
            fields.push('"' + this.description.table + '"."' + _description.fields[i] + '"');
        }

        var from = [ '"' + this.description.table + '"' ];
        var params = [];
        for (var i = 0; i < _description.join.length; i++) { from.push(_description.join[i].toSQL(params)); }

        var fieldsPart = this.createFieldsForSelect(fields, params);
        var fromPart   = from.join(' ');
        var wherePart  = conditions.where(this.conditions, _where, params);
        var groupPart  = _description.group ? (' GROUP BY ' + description.group) : '';
        var orderPart  = _description.order ? (' ORDER BY ' + description.order) : '';
        var limitPart  = _description.limit ? (' LIMIT $' + params.push(description.limit)) : '';
        var offsetPart = _description.offset ? (' OFFSET $' + params.push(description.offset)) : '';

        return this.dao[type]('SELECT ' + fieldsPart + ' FROM ' + fromPart + ' ' + wherePart + groupPart + orderPart + limitPart + offsetPart, params, _description.onConnection);
    };

    Instance.prototype.select = function(where, description) {
        return this._select('select', where, description);
    };

    Instance.prototype.selectOne = function(where, description) {
        return this._select('selectOne', where, description);
    };

    Instance.prototype.selectStream = function(where, description) {
        return this._select('selectStream', where, description);
    };

    Instance.prototype.createFieldsForSelect = function(fields, params) {
        var result = [];
        for (var i = 0; i < fields.length; i++) {
            result.push(fields[i].toSQL ? fields[i].toSQL(params) : fields[i]);
        }
        return result.join(',');
    };
};

function parseFields(fields) {
    return fields.map(function(field) { return typeof(field) === 'string' ? field : field.name });
}