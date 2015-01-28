function ArrayField(field, as) {
    this.field = field;
    this.as    = as;
}

ArrayField.prototype.toSQL = function() {
    return '(SELECT array_to_json(array_agg(row)) FROM (' + this.field +') AS row) as "' + this.as + '"';
}

module.exports = ArrayField;