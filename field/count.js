function CountField(field, as) {
    this.field = field || '*';
    this.as    = as || 'count';
}

CountField.prototype.toSQL = function() {
    return 'count(' + this.field + ') AS "' + this.as + '"';
};

module.exports = CountField;