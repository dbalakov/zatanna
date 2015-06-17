var cwd = process.cwd();

var assert = require("chai").assert;

var config   = require(cwd + '/test/env/config');
var DAO      = require(cwd);
var Instance = require(cwd + '/instance');

var organizations_description = { table  : 'Organizations', fields : [ 'id', 'name' ] };
var members_description       = { table  : 'Members', fields : [ 'id', 'organization', 'name' ] };

describe('Instance_Select', function() {
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

    it('Select', function(done) {
        var dao     = new DAO(config.db.main);
        var members = new Instance(dao, members_description);
        members.select().then(function(result) {
            result.sort(function(a, b) { return a.id > b.id ? 1 : 0; });
            assert.deepEqual(result, [
                { id : 1, organization : 1, name : 'Ozwell E. Spencer' },
                { id : 2, organization : 1, name : 'Albert Wesker' },
                { id : 3, organization : 1, name : 'Sergei Vladimir' },
                { id : 4, organization : 2, name : 'Miles Bennett Dyson' }
            ], 'See valid result');

            done();
        }).catch(done);
    });

    it('Select with custom fields', function(done) {
        var dao     = new DAO(config.db.main);
        var members = new Instance(dao, members_description);
        members.select(null, { fields : [ 'id', 'organization', 'name', new DAO.Field("'2015-11-11'::timestamp", 'date') ] }).then(function(result) {
            result.sort(function(a, b) { return a.id > b.id ? 1 : 0; });
            assert.deepEqual(result, [
                { id : 1, organization : 1, name : 'Ozwell E. Spencer', date : new Date(2015, 10, 11) },
                { id : 2, organization : 1, name : 'Albert Wesker', date : new Date(2015, 10, 11) },
                { id : 3, organization : 1, name : 'Sergei Vladimir', date : new Date(2015, 10, 11) },
                { id : 4, organization : 2, name : 'Miles Bennett Dyson', date : new Date(2015, 10, 11) }
            ], 'See valid result');

            done();
        }).catch(done);
    });

    it('Select with conditions', function(done) {
        var dao     = new DAO(config.db.main);
        var members = new Instance(dao, organizations_description);
        var description = {
            fields : [
                'id',
                'name',
                new DAO.Field.Array('SELECT "Members"."id", "Members"."name" FROM "Members" WHERE "Members"."organization" = "Organizations"."id" ORDER BY "Members"."id"', 'members')
            ]
        }

        members.select({ id : 1 }, description).then(function(result) {
            result.sort(function(a, b) { return a.id > b.id ? 1 : 0; });
            assert.deepEqual(result, [
                {
                    id : 1,
                    name : 'Umbrella',
                    members: [
                        { id : 1, name : 'Ozwell E. Spencer' },
                        { id : 2, name : 'Albert Wesker' },
                        { id : 3, name : 'Sergei Vladimir' }
                    ]
                }
            ], 'See valid result');

            done();
        }).catch(done);
    });

    it('Select with fields', function(done) {
        var dao         = new DAO(config.db.main);
        var members     = new Instance(dao, members_description);
        var description = {
            fields : [
                'name',
                new DAO.Field("'2015-11-11'::timestamp", 'date'),
                new DAO.Field.Link('SELECT "Organizations"."name" FROM "Organizations" WHERE "Organizations"."id" = "Members"."organization"', 'organization')
            ]
        };

        members.select({ organization : 1 }, description).then(function(result) {
            result.sort(function(a, b) { return a.id > b.id ? 1 : 0; });
            assert.deepEqual(result, [
                { name : 'Ozwell E. Spencer', date : new Date(2015, 10, 11), organization: { name : "Umbrella" } },
                { name : 'Albert Wesker', date : new Date(2015, 10, 11), organization: { name : "Umbrella" } },
                { name : 'Sergei Vladimir', date : new Date(2015, 10, 11), organization: { name : "Umbrella" } }
            ], 'See valid result');

            done();
        }).catch(done);
    });

    it('Select with join', function(done) {
        var dao         = new DAO(config.db.main);
        var members     = new Instance(dao, members_description);

        var description = {
            fields : [
                'id', 'name', new DAO.Field('organization', 'organization_id'), new DAO.Field('"Organizations"."name"', 'organization')
            ],
            join : [
                new DAO.Join.Right('Organizations', '"Organizations"."id" = "Members"."organization"')
            ]
        };

        members.select(null, description).then(function(result) {
            result.sort(function(a, b) { return a.id > b.id ? 1 : 0; });
            assert.deepEqual(result, [
                { id : 1, name : 'Ozwell E. Spencer', organization_id : 1, organization : 'Umbrella' },
                { id : 2, name : 'Albert Wesker', organization_id : 1, organization : 'Umbrella' },
                { id : 3, name : 'Sergei Vladimir', organization_id : 1, organization : 'Umbrella' },
                { id : 4, name : 'Miles Bennett Dyson', organization_id : 2, organization : 'Cyberdyne Systems' }
            ], 'See valid result');

            done();
        });
    });

    it('Select with order', function(done) {
        var dao         = new DAO(config.db.main);
        var members     = new Instance(dao, members_description);

        members.select(null, { order : '"name"' }).then(function(result) {
            assert.deepEqual(result, [
                { id : 2, organization : 1, name : 'Albert Wesker' },
                { id : 4, organization : 2, name : 'Miles Bennett Dyson' },
                { id : 1, organization : 1, name : 'Ozwell E. Spencer' },
                { id : 3, organization : 1, name : 'Sergei Vladimir' }
            ], 'See valid result');

            done();
        }).catch(done);
    });

    it('Select with limit & offset', function(done) {
        var dao         = new DAO(config.db.main);
        var members     = new Instance(dao, members_description);

        members.select(null, { order : '"name"', limit : 2, offset : 1 }).then(function(result) {
            assert.deepEqual(result, [
                { id : 4, organization : 2, name : 'Miles Bennett Dyson' },
                { id : 1, organization : 1, name : 'Ozwell E. Spencer' }
            ], 'See valid result');

            done();
        }).catch(done);
    });

    it('selectOne', function(done) {
        var dao         = new DAO(config.db.main);
        var members     = new Instance(dao, members_description);

        members.selectOne(null, { order : '"name"', limit : 2, offset : 1 }).then(function(result) {
            assert.deepEqual(result, { id : 4, organization : 2, name : 'Miles Bennett Dyson' }, 'See valid result');

            done();
        }).catch(done);
    });

    it('select with group', function (done) {
        var dao         = new DAO(config.db.main);
        var members     = new Instance(dao, members_description);

        members.select(null, { fields: ['organization'], group : '"organization"'}).then(function(result) {
            assert.deepEqual(result, [
                { organization : 1 },
                { organization : 2 }
            ]);

            done();
        }).catch(done);
    })
});