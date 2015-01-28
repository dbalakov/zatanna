var cwd = process.cwd();

var assert    = require("chai").assert;

var LinkField = require(cwd + '/field/link');

describe('Field', function() {
    it('Constructor', function() {
        var field = new LinkField('SELECT "Organizations"."id", "Organizations"."name" FROM "Organizations"', 'organization');

        assert.equal(field.field, 'SELECT "Organizations"."id", "Organizations"."name" FROM "Organizations"', 'See valid field');
        assert.equal(field.as, 'organization', 'See valid as');
    });

    it('toSQL', function() {
        var field = new LinkField('SELECT "Organizations"."id", "Organizations"."name" FROM "Organizations"', 'organization');

        assert.equal(field.toSQL(), '(SELECT row_to_json(row) FROM (SELECT "Organizations"."id", "Organizations"."name" FROM "Organizations") AS row) as "organization"', 'See valid result');
    });
});