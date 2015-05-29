var cwd = process.cwd();

var assert = require("chai").assert;

var config   = require(cwd + '/test/env/config');
var DAO      = require(cwd);
var Instance = require(cwd + '/instance');

var organizations_description = { table  : 'Organizations', fields : [ 'id', 'name' ] };

describe('Instance_Delete', function() {
    beforeEach(function(done) {
        var dao = new DAO(config.db.main);
        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');
        dao.executeSql('CREATE TABLE "Organizations" (id smallint, name text);');

        dao.execute().then(function() { done(); }).catch(done);
    });

    after(function(done) {
        var dao = new DAO(config.db.main);
        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');

        dao.execute().then(function() { done(); }).catch(done);
    });

    it('Delete', function(done) {
        var dao = new DAO(config.db.main);
        var instance = new Instance(dao, organizations_description);
        instance.insert({ id : 2, name : 'Cyberdyne Systems' });
        instance.delete();

        dao.execute().then(function() {
            return dao.select('SELECT id, name FROM "Organizations"');
        }).then(function(result) {
            assert.deepEqual(result, [ ]);

            done();
        }).catch(done);
    });

    it('Delete with conditions', function(done) {
        var dao = new DAO(config.db.main);
        var instance = new Instance(dao, organizations_description);
        instance.insert({ id : 1, name : 'Umbrella' });
        instance.insert({ id : 2, name : 'Cyberdyne Systems' });
        instance.delete({ id : 1 });

        dao.execute().then(function() {
            return dao.select('SELECT id, name FROM "Organizations"');
        }).then(function(result) {
            assert.deepEqual(result, [ { id : 2, name : 'Cyberdyne Systems' } ]);

            done();
        }).catch(done);
    });
});