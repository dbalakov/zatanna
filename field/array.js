function ArrayField(field, as) {
    this.field = field;
    this.as    = as;
}

ArrayField.prototype.toSQL = function(params) {
    return '(SELECT array_to_json(array_agg(row)) FROM (' + this.calculateField(params) +') AS row) as "' + this.as + '"';
};

ArrayField.prototype.calculateField = function (params) {
    return typeof this.field == "string" ? this.field : this.field(params);
};

module.exports = ArrayField;