function CreateJoin(type) {
    function Result(table, on, alias) {
        this.table  = table;
        this.on     = on;
        this.alias  = alias;
    };

    Result.prototype.toSQL = function() {
        return type + ' JOIN "' + this.table + '" ' + (this.alias ? this.alias + ' ' : '') + 'ON ' + this.on;
    };

    return Result;
}

module.exports       = CreateJoin('INNER');
module.exports.Left  = CreateJoin('LEFT');
module.exports.Right = CreateJoin('RIGHT');