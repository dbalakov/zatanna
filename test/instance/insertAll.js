var cwd = process.cwd();

var assert = require("chai").assert;

var config   = require(cwd + '/test/env/config');
var DAO      = require(cwd);
var Instance = require(cwd + '/instance');

var organizations_description = { table  : 'Organizations', fields : [ 'id', 'name' ] };

describe('Instance_insertAll', function() {
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

    it('Insert', function(done) {
        var dao = new DAO(config.db.main);
        var instance = new Instance(dao, organizations_description);
        instance.insertAll([
            { id : 1, name : 'Umbrella', other : '132' },
            { id : 2, name : 'Cyberdyne Systems' }
        ]);

        dao.execute().then(function() {
            return dao.select('SELECT id, name FROM "Organizations" ORDER BY id');
        }).then(function(result) {
            assert.deepEqual(result, [
                { id : 1, name : 'Umbrella' },
                { id : 2, name : 'Cyberdyne Systems' }
            ]);

            done();
        }).catch(done);
    });
});