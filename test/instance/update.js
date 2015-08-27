var cwd = process.cwd();

var assert = require("chai").assert;

var config   = require(cwd + '/test/env/config');
var DAO      = require(cwd);
var Instance = require(cwd + '/instance');

var organizations_description = { table  : 'Organizations', fields : [ 'id', 'name' ] };

describe('Instance_Update', function() {
    it('Update', function(done) {
        var dao = new DAO(config.db.main);
        var instance = new Instance(dao, organizations_description);
        instance.insert({ id : 2, name : 'Cyberdyne Systems' });
        instance.update({ id : 3 });

        dao.execute().then(function() {
            return dao.select('SELECT id, name FROM "Organizations"');
        }).then(function(result) {

                assert.deepEqual(result, [ { id : 3, name : 'Cyberdyne Systems' } ]);

                done();
            }).catch(done);
    });

    it('Update with conditions', function(done) {
        var dao = new DAO(config.db.main);
        var instance = new Instance(dao, organizations_description);
        instance.insert({ id : 1, name : 'Ambrella' });
        instance.insert({ id : 2, name : 'Cyberdyne Systems' });
        instance.update({ name : 'Umbrella' }, { id : 1 });

        dao.execute().then(function() {
            return dao.select('SELECT id, name FROM "Organizations"');
        }).then(function(result) {
                result.sort(function(a, b) { return a.id > b.id ? 1 : 0; });
                assert.deepEqual(result, [ { id : 1, name : 'Umbrella' }, { id : 2, name : 'Cyberdyne Systems' } ], 'See valid DB');

                done();
            }).catch(done);
    });

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
});