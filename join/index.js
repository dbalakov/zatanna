var Field = require('../field');

function CreateJoin(type) {
    function Result(table, on) {
        this.table  = table;
        this.on     = on;
    };

    Result.prototype.toSQL = function() {
        return type + ' JOIN "' + this.table + '" ON ' + this.on;
    };

    return Result;
}

module.exports       = CreateJoin('INNER');
module.exports.Left  = CreateJoin('LEFT');
module.exports.Right = CreateJoin('RIGHT');