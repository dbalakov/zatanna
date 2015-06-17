var cwd = process.cwd();

var assert     = require("chai").assert;

var conditions = require(cwd + '/instance/conditions');

var description = {
    id : function(value, params) {
        return '"id"=$' + params.push(value);
    },
    name : function(value, params) {
        return '"name"=$' + params.push(value);
    },
    empty : function() {
        return;
    }
};

describe('Conditions', function() {
    it('where with null conditions', function() {
        var params = [ 1 ];
        var where = conditions.where(description, null, params);

        assert.equal(where, '');
        assert.deepEqual(params, [ 1 ]);
    });

    it('where with null condition', function() {
        var params = [ 1 ];
        var where = conditions.where(description, { id : null, name : 'Weyland-Yutani Corporation', empty : 123 }, params);

        assert.equal(where, ' WHERE "id"=$2 AND "name"=$3', 'See valid where');
        assert.deepEqual(params, [ 1, null, 'Weyland-Yutani Corporation' ]);
    });

    it('where with undefined condition', function() {
        var params = [ 1 ];
        var where = conditions.where(description, { id : undefined, name : 'Weyland-Yutani Corporation', empty : 123 }, params);

        assert.equal(where, ' WHERE "name"=$2', 'See valid where');
        assert.deepEqual(params, [ 1, 'Weyland-Yutani Corporation' ]);
    });

    it('where without conditions', function() {
        var params = [ 1 ];
        var where = conditions.where(description, { another : 'Weyland-Yutani Corporation' }, params);

        assert.equal(where, '');
        assert.deepEqual(params, [ 1 ]);
    });

    it('createWhere with conditions', function() {
        var params = [ 1 ];
        var where = conditions.where(description, { id : null, name : 'Weyland-Yutani Corporation' }, params);

        assert.equal(where, ' WHERE "id"=$2 AND "name"=$3', 'See valid where');
        assert.deepEqual(params, [ 1, null, 'Weyland-Yutani Corporation' ]);
    });

    it('createEqual', function() {
        var result = {};
        conditions.createEqual(result, { table : 'Organizations', fields : [ 'id', 'name' ] });

        assert.isDefined(result.id, 'See id equal condition');
        assert.isDefined(result.name, 'See name equal condition');

        var params = [ 42, 21 ];
        var sql = result.id(18, params);

        assert.equal(sql, '"Organizations"."id"=$3', 'See valid sql');
        assert.deepEqual(params, [ 42, 21, 18 ], 'See valid params');
    });
});