var cwd = process.cwd();

var assert    = require("chai").assert;

var CountField = require(cwd + '/field/count');

describe('CountField', function() {
    it('Constructor', function() {
        assert.equal(new CountField().field, '*', 'See valid default field');
        assert.equal(new CountField().as, 'count', 'See valid default as');

        assert.equal(new CountField('id', 'c').field, 'id', 'See valid field');
        assert.equal(new CountField('id', 'c').as, 'c', 'See valid as');
    });

    it('toSQL', function() {
        var field = new CountField();

        assert.equal(field.toSQL(), 'count(*) AS "count"', 'See valid result');
    });
});