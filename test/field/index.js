var cwd = process.cwd();

var assert = require("chai").assert;

var Field  = require(cwd + '/field');

describe('Field', function() {
    it('Constructor', function() {
        var field = new Field('"id"', 'org_id');

        assert.equal(field.field, '"id"', 'See valid field');
        assert.equal(field.as, 'org_id', 'See valid as');
    });

    it('toSQL', function() {
        var field_with_as    = new Field('"id"', 'org_id');
        var field_without_as = new Field('"id"');

        assert.equal(field_with_as.toSQL(), '"id" as "org_id"', 'See valid result with as');
        assert.equal(field_without_as.toSQL(), '"id"', 'See valid result without as');
    });

    it('toSQL with params', function() {
        var field    = new Field(function (params) {
            return '"tax" + $' + params.length
        }, 'realTax');

        assert.equal(field.toSQL([13]), '"tax" + $1 as "realTax"', 'See valid result with as');
    });
});