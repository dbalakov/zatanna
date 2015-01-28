var cwd = process.cwd();

var assert = require("chai").assert;

var Join   = require(cwd + '/join');

describe('Join', function() {
    it('Inner', function() {
        var join = new Join('Organizations', '"Organizations"."id" = "Members"."organization"');

        assert.equal(join.table, 'Organizations', 'See valid table');
        assert.equal(join.on, '"Organizations"."id" = "Members"."organization"', 'See valid on');

        assert.equal(join.toSQL(), 'INNER JOIN "Organizations" ON "Organizations"."id" = "Members"."organization"', 'See valid on');
    });

    it('Left', function() {
        var join = new Join.Left('Organizations', '"Organizations"."id" = "Members"."organization"');

        assert.equal(join.table, 'Organizations', 'See valid table');
        assert.equal(join.on, '"Organizations"."id" = "Members"."organization"', 'See valid on');

        assert.equal(join.toSQL(), 'LEFT JOIN "Organizations" ON "Organizations"."id" = "Members"."organization"', 'See valid on');
    });

    it('Right', function() {
        var join = new Join.Right('Organizations', '"Organizations"."id" = "Members"."organization"');

        assert.equal(join.table, 'Organizations', 'See valid table');
        assert.equal(join.on, '"Organizations"."id" = "Members"."organization"', 'See valid on');

        assert.equal(join.toSQL(), 'RIGHT JOIN "Organizations" ON "Organizations"."id" = "Members"."organization"', 'See valid on');
    });
});