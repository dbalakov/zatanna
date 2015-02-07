var cwd = process.cwd();

var assert   = require("chai").assert;

var config   = require(cwd + '/test/env/config');
var DAO      = require(cwd);
var Instance = require(cwd + '/instance');
var Factory  = require(cwd + '/instance/factory');

var organizations_description = { table  : 'Organizations', fields : [ 'id', 'name' ] };
var members_description       = { table  : 'Members', fields : [ 'id', 'organization', 'name' ] };

var organizations_injection = {
    conditions : {
        members : function(value, params) {
            return '(SELECT count(*) FROM "Members" WHERE "Members"."organization" = "Organizations"."id") > $' + params.push(value);
        }
    },
    methods : {
        selectWithMembers : function(conditions) {
            return this.select(conditions, {
                fields : [
                    'id',
                    'name',
                    new DAO.Field.Array('SELECT "Members"."id", "Members"."name" FROM "Members" WHERE "Members"."organization" = "Organizations"."id" ORDER BY "Members"."id"', 'members')
                ]
            });
        }
    }
};

describe('Factory', function() {
    beforeEach(function(done) {
        var dao           = new DAO(config.db.main);
        var organizations = new Instance(dao, organizations_description);
        var members       = new Instance(dao, members_description);

        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');
        dao.executeSql('DROP TABLE IF EXISTS "Members";');

        dao.executeSql('CREATE TABLE "Organizations" (id smallint, name text);');
        dao.executeSql('CREATE TABLE "Members" (id smallint, organization smallint, name text);');

        organizations.insert({ id : 1, name : 'Umbrella' });
        organizations.insert({ id : 2, name : 'Cyberdyne Systems' });

        members.insert({ id : 1, organization : 1, name : 'Ozwell E. Spencer' });
        members.insert({ id : 2, organization : 1, name : 'Albert Wesker' });
        members.insert({ id : 3, organization : 1, name : 'Sergei Vladimir' });
        members.insert({ id : 4, organization : 2, name : 'Miles Bennett Dyson' });

        dao.execute().then(function() { done(); }).catch(done);
    });

    after(function(done) {
        var dao = new DAO(config.db.main);

        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');
        dao.executeSql('DROP TABLE IF EXISTS "Members";');

        dao.execute().then(function() { done(); }).catch(done);
    });

    it('constructor', function() {
        var factory          = new Factory(cwd + '/test/env/models');

        assert.equal(factory.path, cwd + '/test/env/models', 'See valid path');
    });

    it('get', function() {
        var factory          = Factory.get(cwd + '/test/env/models');
        var another_factory  = Factory.get(cwd + '/test/env/models');
        var next_factory     = Factory.get(cwd + '/test/env/next_models');

        assert.equal(factory.path, cwd + '/test/env/models', 'See valid path');
        assert.equal(factory, another_factory, 'Factories with one path are equal');
        assert.notEqual(factory, next_factory, 'Factories with another path another factory');
    });

    it('createInstance', function(done) {
        var dao = new DAO(config.db.main)
        var factory   = new Factory(cwd + '/test/env/models');

        var organizations = factory.createInstance(dao, organizations_description, organizations_injection);

        assert.equal(organizations.description, organizations_description, 'See valid instance description');
        assert.isDefined(organizations.conditions.members, 'See condition from injection');
        assert.isDefined(organizations.selectWithMembers, 'See method from injection');

        organizations.selectWithMembers({ members : 2 }).then(function(result) {
            assert.deepEqual(result,
                [
                    {
                        id : 1,
                        name : 'Umbrella',
                        members : [
                            { id : 1, name : 'Ozwell E. Spencer' },
                            { id : 2, name : 'Albert Wesker' },
                            { id : 3, name : 'Sergei Vladimir' }
                        ] }
                ], 'See valid result');

            done();
        });
    });

    it('createInstances', function() {
        var dao     = new DAO(config.db.main);
        var factory = Factory.get(cwd + '/test/env/models');

        factory.createInstances(dao);

        assert.isDefined(dao.organizations, 'See instance organizations');
        assert.isDefined(dao.members, 'See instance members');

        assert.isDefined(dao.organizations.conditions.members, 'See condition');
        assert.isDefined(dao.organizations.selectWithMembers, 'See condition');
    });
});