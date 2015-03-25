var cwd = process.cwd();

var assert    = require("chai").assert;

var ArrayField = require(cwd + '/field/array');

describe('Field', function() {
    it('Constructor', function() {
        var field = new ArrayField('SELECT "Organizations"."id", "Organizations"."name" FROM "Organizations"', 'organization');

        assert.equal(field.field, 'SELECT "Organizations"."id", "Organizations"."name" FROM "Organizations"', 'See valid field');
        assert.equal(field.as, 'organization', 'See valid as');
    });

    it('toSQL', function() {
        var field = new ArrayField('SELECT "Members"."id", "Members"."name" FROM "Members" WHERE Members."id" = "Organization"."member"', 'members');

        assert.equal(field.toSQL(), '(SELECT array_to_json(array_agg(row)) FROM (SELECT "Members"."id", "Members"."name" FROM "Members" WHERE Members."id" = "Organization"."member") AS row) as "members"', 'See valid result');
    });

    it('toSQL with params', function() {
        var field = new ArrayField(function (params) {
            return 'SELECT "Members"."id", "Members"."name" FROM "Members" WHERE Members."id" = $' + params.length
        }, 'members');

        assert.equal(field.toSQL(["someUUID"]), '(SELECT array_to_json(array_agg(row)) FROM (SELECT "Members"."id", "Members"."name" FROM "Members" WHERE Members."id" = $1) AS row) as "members"', 'See valid result');
    });
});