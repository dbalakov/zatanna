var cwd = process.cwd();

var assert = require("chai").assert;
var sinon  = require("sinon");

var config = require(cwd + '/test/env/config');
var DAO    = require(cwd);

describe('DAO', function() {
    it('Constructor', function() {
        var dao = new DAO(config.db.main);

        assert.equal(dao.config, config.db.main, 'See valid config');
    });

    it('createClient: invalid config', function(done) {
        var dao = new DAO({ "driver": "pg", "user": "postgres", "host": "invalid_host", "database": "dao_test" });

        dao.createClient().then(function() { throw new Error('Called resolve'); }).catch(function(error) {
            assert.isUndefined(dao.client, 'Client is undefined');

            done();
        });
    });

    it('createClient: valid config', function(done) {
        var dao = new DAO(config.db.main);

        dao.createClient().catch(function(error) { throw new Error(error); }).then(function(client) {
            assert.equal(dao.client, client, 'See valid client');
            assert.ok(dao.client.readyForQuery, 'Client is ready for query');

            client.end();

            done();
        });
    });

    it('end: see valid executing without client', function() {
        var dao = new DAO(config.db.main);
        assert.doesNotThrow(function() { dao.end(); }, null, "end doesn't throw error");
    });

    it('end: see valid executing with client', function() {
        var dao = new DAO(config.db.main);
        var end = sinon.spy();
        dao.client = { end : end }

        dao.end();

        assert(end.calledOnce, 'client.end is called');
        assert.isUndefined(dao.client, 'Client is undefined');
    });

    it('select: invalid config', function(done) {
        var dao = new DAO({ "driver": "pg", "user": "postgres", "host": "invalid_host", "database": "dao_test" });

        dao.select("SELECT 1 as id, 'text' as value").then(function() { throw new Error('Called resolve'); }).catch(function(error) {
            assert.isUndefined(dao.client, 'Client is undefined');

            done();
        });
    });

    it('select: invalid query', function(done) {
        var dao = new DAO(config.db.main);

        dao.select("INVALID QUERY").then(function() { throw new Error('Called resolve'); }).catch(function(error) {
            assert.isUndefined(dao.client, 'Client is undefined');

            done();
        });
    });

    it('select: valid query', function(done) {
        var dao = new DAO(config.db.main);

        dao.select("SELECT 1 as id, 'text' as value").catch(function(error) { throw new Error(error); }).then(function(result) {
            assert.deepEqual(result, [ { id : 1, value : 'text' } ]);
            assert.isUndefined(dao.client, 'Client is undefined');

            done();
        });
    });

    it('selectOne: valid query', function(done) {
        var dao = new DAO(config.db.main);

        dao.selectOne("SELECT 1 as id, 'text' as value").catch(function(error) { throw new Error(error); }).then(function(result) {
            assert.deepEqual(result, { id : 1, value : 'text' });
            assert.isUndefined(dao.client, 'Client is undefined');

            done();
        });
    });
});