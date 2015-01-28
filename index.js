var Promise = require("bluebird");
var pg      = require("pg");

var Factory = require("./instance/factory");

function DAO(config, path) {
    this.config = config;
    this.queue  = [];

    if (path) {
        Factory.get(path).createInstances(this);
    }
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
    return that.createClient().catch(function(error) { that.end(); throw error;}).then(function() {
        return new Promise(function(resolve, reject) {
            var result = [];
            var query  = that.client.query(sql, params);
            query.on('row', function(row) { result.push(row); });
            query.on('error', function(error) { that.end(); reject(error); });
            query.on('end', function() { that.end(); resolve(result); });
        });
    });
};

DAO.prototype.selectOne = function(sql, params) {
    return this.select(sql, params).then(function(result) { return result[0]; });
};

DAO.prototype.executeSql = function(sql, params) {
    this.queue.push({ sql : sql, params : params });
};

DAO.prototype.execute = function() {
    var that = this;
    return that.createClient().catch(function(error) { that.end(); throw error;}).then(function() {
        return new Promise(function(resolve, reject) {
            var result = [];
            if (that.queue.length == 0) {
                return resolve(result);
            }
            function executeSql(query) {
                that.client.query(query.sql, query.params, function(error, res) {
                    if(error) {
                        that.queue = [];
                        that.end();
                        return reject(error);
                    }

                    result.push(res);
                    if (that.queue.length == 0) {
                        that.end();
                        return resolve(result);
                    }
                    executeSql(that.queue.shift());
                });
            }
            executeSql(that.queue.shift());
        });
    });
};

DAO.Field = require('./field');
DAO.Join  = require('./join');

module.exports = DAO;