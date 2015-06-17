module.exports = function(Instance) {
    Instance.prototype.insertAll = function(objs) {
        var SQL = 'INSERT INTO "' + this.description.table + '" SELECT * FROM json_populate_recordset(null::"' + this.description.table +  '", $1::json);';
        this.dao.executeSql(SQL, [ JSON.stringify(objs) ]);
    };
};