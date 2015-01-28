function LinkField(field, as) {
    this.field = field;
    this.as    = as;
}

LinkField.prototype.toSQL = function() {
    return '(SELECT row_to_json(row) FROM (' + this.field +') AS row) as "' + this.as + '"';
}

module.exports = LinkField;