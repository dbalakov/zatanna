var cwd = process.cwd();

var Promise = require("bluebird");

var assert = require("chai").assert;
var sinon  = require("sinon");

var DAO    = require(cwd);
var config = require(cwd + '/test/env/config');
var Logger = require(cwd + '/logger');

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

        assert(dao.logger instanceof Logger, 'logger is Logger')
        assert.equal(dao.config, config.db.main, 'See valid config');

        assert.isDefined(dao.organizations, 'See instance organizations');
        assert.isDefined(dao.members, 'See instance members');

        assert.isDefined(dao.organizations.conditions.members, 'See condition');
        assert.isDefined(dao.organizations.selectWithMembers, 'See condition');
    });

    it('createClient: invalid config', function (done) {
        var dao = new DAO(invalid_config);
        dao.logger.set(createLogger(), 0);
        Promise.using(dao.createClient(), function () {
            done(new Error('Called resolve'));
        }).catch(function (error) {
            assert(dao.logger.logger.error.calledOnce, 'logger.error was called');
            done();
        });
    });

    it('createClient: valid config', function(done) {
        var dao = new DAO(config.db.main);
        dao.logger.set(createLogger(), 0);
        var clientSpy;
        Promise.using(dao.createClient(), function (client) {
            clientSpy = sinon.spy(client, "end");
            assert(client.readyForQuery, 'Client is ready for query');
            assert(dao.logger.logger.log.calledWith('Connected'), 'Logger.log was called with "Connected" argument');
        }).then(function () {
            assert(dao.logger.logger.log.calledWith('Disconnected'), 'Logger.log was called with "Disconnected" argument');
            assert(clientSpy.calledOnce, 'client.end was called');
            done();
        }).catch(function (error) {
            done(error);
        })

    });

    it('select: invalid config', function(done) {
        var dao = new DAO(invalid_config);

        dao.select("SELECT 1 as id, 'text' as value").then(function() { done(new Error('Called resolve')); }).catch(function() { done(); });
    });

    it('select: invalid query', function(done) {
        var dao = new DAO(config.db.main);
        dao.logger.set(createLogger(), 0);

        dao.select("INVALID QUERY").then(function() { done(new Error('Called resolve')); }).catch(function() {
            assert(dao.logger.logger.error.calledOnce, 'Logger.error was called');

            done();
        });
    });

    it('select: valid query', function(done) {
        var dao = new DAO(config.db.main);
        dao.logger.set(createLogger(), 0);

        dao.select("SELECT 1 as id, 'text' as value").then(function(result) {
            assert.deepEqual(result, [ { id : 1, value : 'text' } ]);
            assert(dao.logger.logger.log.calledThrice, 'Logger.log was called');

            done();
        }).catch(function(error) { done(new Error(error)); });
    });

    it('selectOne: valid query', function(done) {
        var dao = new DAO(config.db.main);

        dao.selectOne("SELECT 1 as id, 'text' as value").then(function(result) {
            assert.deepEqual(result, { id : 1, value : 'text' });

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
        dao.execute().then(function() { done(new Error('Called resolve')); }).catch(function() { done(); });
    });

    it('execute: invalid query', function(done) {
        var beforeExecute = sinon.spy();
        var afterExecute = sinon.spy();
        var dao = new DAO(config.db.main);

        dao.on(DAO.EVENTS.BEFORE_EXECUTE, beforeExecute);
        dao.on(DAO.EVENTS.AFTER_EXECUTE, afterExecute);
        dao.logger.set(createLogger(), 0);

        dao.executeSql('INVALID QUERY');
        dao.execute().then(function() { done(new Error('Called resolve')); }).catch(function() {
            assert(dao.logger.logger.error.calledOnce, 'Logger.error was called');
            assert(beforeExecute.calledOnce, 'Before execute called');
            assert(afterExecute.notCalled, 'After execute not called');
            done();
        });
    });

    it('execute', function(done) {
        var beforeExecute = sinon.spy();
        var afterExecute = sinon.spy();
        var dao = new DAO(config.db.main);

        dao.on(DAO.EVENTS.BEFORE_EXECUTE, beforeExecute);
        dao.on(DAO.EVENTS.AFTER_EXECUTE, afterExecute);
        dao.logger.set(createLogger(), 0);

        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');
        dao.executeSql('CREATE TABLE "Organizations" (id smallint, name text);');
        dao.executeSql('INSERT INTO "Organizations" VALUES ($1, $2);', [ 1, 'Umbrella' ]);
        dao.execute().then(function(result) {
            assert.lengthOf(result, 3, 'See valid result length');
            assert.equal(dao.logger.logger.log.callCount, 5, 'Logger.log was called for each query');

            assert(beforeExecute.calledOnce, 'Before execute called');
            assert(afterExecute.calledOnce, 'After execute called');
            assert(afterExecute.calledWith(result), 'After execute called with valid arguments');

            return dao.select('SELECT "id", "name" FROM "Organizations"');
        }).then(function(result) {
            assert.deepEqual(result, [ { id : 1, name : 'Umbrella' } ]);

            done();
        }).catch(function(error) { done(error); });
    });
});

function createLogger() {
    return {
        log   : sinon.spy(),
        debug : sinon.spy(),
        info  : sinon.spy(),
        warn  : sinon.spy(),
        error : sinon.spy()
    };
}