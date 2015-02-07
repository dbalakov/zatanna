var cwd = process.cwd();

var DAO = require(cwd);

module.exports = function(conditions, description) {
    description = description || {};
    description.fields = [ 'id', 'name', new DAO.Field.Array('SELECT "Members".id, "Members".name FROM "Members" WHERE "Members"."organization" = "Organizations"."id"', 'members') ];
    return this.select(conditions, description);
};