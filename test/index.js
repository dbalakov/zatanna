var cwd = process.cwd();

var Promise = require("bluebird");
var pg = require("pg");

var assert = require("chai").assert;
var sinon  = require("sinon");

var DAO    = require(cwd);
var config = require(cwd + '/test/env/config');
var Logger = require(cwd + '/logger');

var invalid_config = { "driver": "pg", "user": "postgres", "host": "invalid_host", "database": "dao_test" };

describe('DAO', function() {
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

    it('createClient: onConnection', function(done) {
        var dao = new DAO(config.db.main);
        var onConnection = {sql: 'SELECT 42 AS test;'};
        dao.logger.set(createLogger(), 0);
        var clientSpy;
        Promise.using(dao.createClient(onConnection), function (client) {
            assert(dao.logger.logger.log.args[1][0].result[0].test === 42, 'Logger.log was called with onConnection query result');
            done();
        }).catch(function (error) {
            done(error);
        })

    });

    it('createClient: pool', function(done) {
        var pool = new pg.Pool(config.db.main);
        var dao = new DAO(config.db.main, undefined, pool);

        dao.logger.set(createLogger(), 0);

        var clientSpy;

        Promise.using(dao.createClient(), function(client) {
            clientSpy = sinon.spy(client, "release");
            assert(client.readyForQuery, 'Client is ready for query');
            assert(dao.logger.logger.log.calledWith('Connected'), 'Logger.log was called with "Connected" argument');
        }).then(function () {
            assert(dao.logger.logger.log.calledWith('Disconnected'), 'Logger.log was called with "Disconnected" argument');
            assert(clientSpy.calledOnce, 'client.release was called');
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

    it('parses timestamps without time zone correctly', function(done) {
        var dao = new DAO(config.db.main);
        var date = '2015-07-20T10:00:00.000Z';

        dao.executeSql('DROP TABLE IF EXISTS "Dates";');
        dao.executeSql('CREATE TABLE "Dates" (date timestamp without time zone);');
        dao.executeSql('INSERT INTO "Dates" VALUES ($1);', [date]);

        dao.execute().catch(done).then(function(result) {
            return dao.selectOne('SELECT "date" FROM "Dates"');
        }).then(function(result) {
            assert.equal(result.date.toISOString(), date);
            done();
        });
    });

    it('supports successful transactions', function (done) {
        var beforeExecute = sinon.spy();
        var afterExecute = sinon.spy();
        var dao = new DAO(config.db.main);

        dao.on(DAO.EVENTS.BEFORE_EXECUTE, beforeExecute);
        dao.on(DAO.EVENTS.AFTER_EXECUTE, afterExecute);
        dao.logger.set(createLogger(), 0);

        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');
        dao.executeSql('CREATE TABLE "Organizations" (id smallint, name text);');
        dao.execute().then(function () {
            dao.executeSql('INSERT INTO "Organizations" VALUES ($1, $2);', [ 1, 'Umbrella' ]);
            dao.execute(true).then(function () {
                return dao.select('SELECT "id", "name" FROM "Organizations"');
            }).then(function(result) {
                assert.deepEqual(result, [ { id : 1, name : 'Umbrella' } ]);
                done();
            }).catch(done);
        });
    });

    it('supports failing transactions', function (done) {
        var beforeExecute = sinon.spy();
        var afterExecute = sinon.spy();
        var dao = new DAO(config.db.main);

        dao.on(DAO.EVENTS.BEFORE_EXECUTE, beforeExecute);
        dao.on(DAO.EVENTS.AFTER_EXECUTE, afterExecute);
        dao.logger.set(createLogger(), 0);

        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');
        dao.executeSql('CREATE TABLE "Organizations" (id smallint, name text);');
        dao.execute().then(function () {
            dao.executeSql('INSERT INTO "Organizations" VALUES ($1, $2);', [ 1, 'Umbrella' ]);
            dao.executeSql('INSERT INTO "Organizations" VALUES ($1, $2);', [ 'Not a number', 'Umbrella' ]);
            dao.execute(true).then(function () {
                done('Should not succeed');
            }).catch(function () {
                return dao.select('SELECT "id", "name" FROM "Organizations"').then(function(result) {
                    assert.lengthOf(result, 0, 'See catch result length');
                    done();
                }).catch(done);
            });
        });
    });

    afterEach(function(done) {
        var dao = new DAO(config.db.main);
        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');
        dao.executeSql('DROP TABLE IF EXISTS "Dates";');

        dao.execute().then(function() { done(); }).catch(done);
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