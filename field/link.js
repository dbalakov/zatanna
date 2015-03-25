function LinkField(field, as) {
    this.field = field;
    this.as    = as;
}

LinkField.prototype.toSQL = function(params) {
    return '(SELECT row_to_json(row) FROM (' + this.calculateField(params) +') AS row) as "' + this.as + '"';
};

LinkField.prototype.calculateField = function (params) {
    return typeof this.field == "string" ? this.field : this.field(params);
};

module.exports = LinkField;