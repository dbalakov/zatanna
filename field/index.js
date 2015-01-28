function Field(field, as) {
    this.field = field;
    this.as    = as;
}

Field.prototype.toSQL = function() {
    return this.field + (this.as ? ' as "' + this.as + '"' : '');
}

Field.Link = require('./link');
Field.Array = require('./array');

module.exports = Field;