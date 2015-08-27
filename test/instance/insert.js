var cwd = process.cwd();

var assert = require("chai").assert;

var config   = require(cwd + '/test/env/config');
var DAO      = require(cwd);
var Instance = require(cwd + '/instance');

var age_field = { name : 'age', toSQL : function(value, params) { return '$' + params.push(value) + ' + 1'; } };
var organizations_description = { table  : 'Organizations', fields : [ 'id', 'name', age_field ] };

describe('Instance_insert', function() {
    it('Insert', function(done) {
        var dao = new DAO(config.db.main);
        var instance = new Instance(dao, organizations_description);
        instance.insert({ id : 2, name : 'Cyberdyne Systems', age : 21 });

        dao.execute().then(function() {
            return dao.select('SELECT id, name, age FROM "Organizations"');
        }).then(function(result) {
            assert.deepEqual(result, [ { id : 2, name : 'Cyberdyne Systems', age : 22 } ]);

            done();
        }).catch(done);
    });

    beforeEach(function(done) {
        var dao = new DAO(config.db.main);
        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');
        dao.executeSql('CREATE TABLE "Organizations" (id smallint, name text, age smallint);');

        dao.execute().then(function() { done(); }).catch(done);
    });

    after(function(done) {
        var dao = new DAO(config.db.main);
        dao.executeSql('DROP TABLE IF EXISTS "Organizations";');

        dao.execute().then(function() { done(); }).catch(done);
    });
});