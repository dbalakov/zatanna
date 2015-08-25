var cwd = process.cwd();

var assert   = require("chai").assert;

var config   = require(cwd + '/test/env/config');
var DAO      = require(cwd);
var Instance = require(cwd + '/instance');

var organizations_description = { table : 'Organizations', fields : [ 'id', 'name' ] };

describe('Instance_Count', function() {
    beforeEach(function(done) {
        var dao           = new DAO(config.db.main);
        var organizations = new Instance(dao, organizations_description);

        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');
        dao.executeSql('CREATE TABLE "Organizations" (id smallint, name text);');

        organizations.insert({ id : 1, name : 'Umbrella' });
        organizations.insert({ id : 2, name : 'Cyberdyne Systems' });
        organizations.insert({ id : 3, name : 'Umbrella' });

        dao.execute().then(function() { done(); }).catch(done);
    });

    after(function(done) {
        var dao = new DAO(config.db.main);
        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');

        dao.execute().then(function() { done(); }).catch(done);
    });

    it('Count without conditions', function(done) {
        var dao           = new DAO(config.db.main);
        var organizations = new Instance(dao, organizations_description);
        organizations.count().then(function(result) {
            assert.equal(result, 3, 'See valid result');

            done();
        }).catch(done);
    });

    it('Count with conditions', function(done) {
        var dao           = new DAO(config.db.main);
        var organizations = new Instance(dao, organizations_description);
        organizations.count({ name : 'Umbrella' }).then(function(result) {
            assert.equal(result, 2, 'See valid result');

            done();
        }).catch(done);
    });
});