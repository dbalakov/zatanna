function Field(field, as) {
    this.field = field;
    this.as    = as;
}

Field.prototype.toSQL = function(params) {
    return this.calculateField(params) + (this.as ? ' as "' + this.as + '"' : '');
};

Field.prototype.calculateField = function (params) {
    return typeof this.field == "string" ? this.field : this.field(params);
};

Field.Link  = require('./link');
Field.Array = require('./array');
Field.Count = require('./count');

module.exports = Field;