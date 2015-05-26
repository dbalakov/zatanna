var cwd = process.cwd();

var assert = require("chai").assert;
var sinon  = require("sinon");

var config = require(cwd + '/test/env/config');
var DAO    = require(cwd);

var invalid_config = { "driver": "pg", "user": "postgres", "host": "invalid_host", "database": "dao_test" };

describe('DAO', function() {
    afterEach(function(done) {
        var dao = new DAO(config.db.main);
        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');

        dao.execute().then(function() { done(); }).catch(done);
    });

    it('Static', function() {
        assert.equal(DAO.Field, require(cwd + '/field'), 'See valid Field');
        assert.equal(DAO.Field.Link, require(cwd + '/field/link'), 'See valid Link field');
        assert.equal(DAO.Field.Array, require(cwd + '/field/array'), 'See valid Array field');

        assert.equal(DAO.Join, require(cwd + '/join'), 'See valid Join');
    });

    it('Constructor', function() {
        var dao = new DAO(config.db.main, cwd + '/test/env/models');

        assert.equal(dao.config, config.db.main, 'See valid config');

        assert.isDefined(dao.organizations, 'See instance organizations');
        assert.isDefined(dao.members, 'See instance members');

        assert.isDefined(dao.organizations.conditions.members, 'See condition');
        assert.isDefined(dao.organizations.selectWithMembers, 'See condition');
    });

    it('createClient: invalid config', function(done) {
        var dao = new DAO(invalid_config);

        dao.createClient().then(function() { done(new Error('Called resolve')); }).catch(function(error) {
            assert.isUndefined(dao.client, 'Client is undefined');

            done();
        });
    });

    it('createClient: valid config', function(done) {
        var dao = new DAO(config.db.main);

        dao.createClient().catch(function(error) { done(new Error(error)); }).then(function(client) {
            assert.ok(client.readyForQuery, 'Client is ready for query');

            client.end();

            done();
        });
    });

    it('end: see valid executing with client', function() {
        var dao = new DAO(config.db.main);
        var end = sinon.spy();

        dao.end({ end : end });

        assert(end.calledOnce, 'client.end is called');
        assert.isUndefined(dao.client, 'Client is undefined');
    });

    it('select: invalid config', function(done) {
        var dao = new DAO(invalid_config);

        dao.select("SELECT 1 as id, 'text' as value").then(function() { done(new Error('Called resolve')); }).catch(function() {
            assert.isUndefined(dao.client, 'Client is undefined');

            done();
        });
    });

    it('select: invalid query', function(done) {
        var dao = new DAO(config.db.main);

        dao.select("INVALID QUERY").then(function() { done(new Error('Called resolve')); }).catch(function() {
            assert.isUndefined(dao.client, 'Client is undefined');

            done();
        });
    });

    it('select: valid query', function(done) {
        var dao = new DAO(config.db.main);

        dao.select("SELECT 1 as id, 'text' as value").then(function(result) {
            assert.deepEqual(result, [ { id : 1, value : 'text' } ]);
            assert.isUndefined(dao.client, 'Client is undefined');

            done();
        }).catch(function(error) { done(new Error(error)); });
    });

    it('selectOne: valid query', function(done) {
        var dao = new DAO(config.db.main);

        dao.selectOne("SELECT 1 as id, 'text' as value").then(function(result) {
            assert.deepEqual(result, { id : 1, value : 'text' });
            assert.isUndefined(dao.client, 'Client is undefined');

            done();
        }).catch(function(error) { done(new Error(error)); });
    });

    it('executeSql: see valid queue', function() {
        var dao = new DAO(config.db.main);

        dao.executeSql('INSERT INTO "Users" VALUES ($1, $2)', [ 'login', 'password' ]);

        assert.deepEqual(dao.queue, [ { sql : 'INSERT INTO "Users" VALUES ($1, $2)', params : [ 'login', 'password' ] } ]);
    });

    it('execute: invalid config', function(done) {
        var dao = new DAO(invalid_config);

        dao.executeSql('CREATE TABLE "Organizations" (id smallint, name text);');
        dao.executeSql('INSERT INTO "Organizations" VALUES ($1, $2);', [ 1, 'Umbrella' ]);
        dao.execute().then(function() { done(new Error('Called resolve')); }).catch(function(error) {
            assert.isUndefined(dao.client, 'Client is undefined');

            done();
        });
    });

    it('execute', function(done) {
        var dao = new DAO(config.db.main);

        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');
        dao.executeSql('CREATE TABLE "Organizations" (id smallint, name text);');
        dao.executeSql('INSERT INTO "Organizations" VALUES ($1, $2);', [ 1, 'Umbrella' ]);
        dao.execute().catch(function(error) { done(error); }).then(function(result) {
            assert.isUndefined(dao.client, 'Client is undefined');
            assert.lengthOf(result, 3, 'See valid result length');

            return dao.select('SELECT "id", "name" FROM "Organizations"');
        }).then(function(result) {
            assert.deepEqual(result, [ { id : 1, name : 'Umbrella' } ]);

            done();
        });
    });
});