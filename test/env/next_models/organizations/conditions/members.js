module.exports = function(value, params) {
    return '(SELECT count(*) FROM "Members" WHERE "Members"."organization" = "Organizations"."id") > $' + params.push(value);
};