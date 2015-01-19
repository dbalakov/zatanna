var Promise = require("bluebird");
var pg      = require("pg");

function DAO(config) {
    this.config = config;
    this.queue  = [];
}

DAO.prototype.createClient = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        var client = new pg.Client(that.config);
        client.connect(function(error) {
            if (error) {
                return reject(error);
            }
            that.client = client;
            resolve(client);
        });
    });
};

DAO.prototype.end = function() {
    if (!this.client) {
        return;
    }
    this.client.end();
    delete this.client;
};

DAO.prototype.select = function(sql, params) {
    var that = this;
    return new Promise(function(resolve, reject) {
        return that.createClient().then(function() {
            var result = [];
            var query  = that.client.query(sql, params);
            query.on('row', function(row) { result.push(row); });
            query.on('error', function(error) { that.end(); reject(error); });
            query.on('end', function() { that.end(); resolve(result); });
        }).catch(function(error) { reject(error); });
    });
};

DAO.prototype.selectOne = function(sql, params) {
    return this.select(sql, params).then(function(result) { return result[0]; });
};

module.exports = DAO;