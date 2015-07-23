var Promise = require("bluebird");
var pg      = require("pg");

var Factory = require("./instance/factory");
var Logger  = require("./logger");
var Events  = require("./events");

var TIMESTAMP_WOTZ = 1114; // timestamp without time zone
var DATE_PARSER = pg.types.getTypeParser(TIMESTAMP_WOTZ);

pg.types.setTypeParser(TIMESTAMP_WOTZ, function(val) {
    if (val === null) { return null; }

    return new Date(DATE_PARSER(val) - new Date().getTimezoneOffset() * 60 * 1000);
});

function DAO(config, path) {
    this.config = config;
    this.queue  = [];
    this.logger = new Logger();

    Events(this);

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
                that.logger.log(4, [ error ]);
                return reject(error);
            }
            that.logger.log(0, [ 'Connected' ]);
            resolve(client);
        });
    }).disposer(function (client) {
        client.end();
        that.logger.log(0, [ 'Disconnected' ]);
    });
};

DAO.prototype.select = function(sql, params) {
    var that = this;
    return Promise.using(that.createClient(), function(client) {
        return new Promise(function (resolve, reject) {
            var result = [];
            var query = client.query(sql, params);
            query.on('row', function (row) {
                result.push(row);
            });
            query.on('error', function (error) {
                that.logger.log(4, [{sql: sql, params: params, error: error}]);
                reject(error);
            });
            query.on('end', function () {
                that.logger.log(0, [{sql: sql, params: params, result: result}]);
                resolve(result);
            });
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
    return Promise.using(that.createClient(), function(client) {
        return that.dispatchEvent(DAO.EVENTS.BEFORE_EXECUTE).then(function() {
            return new Promise(function (resolve, reject) { //TODO Really?
                var result = [];
                if (that.queue.length == 0) {
                    return resolve(result);
                }
                function executeSql(query) {
                    client.query(query.sql, query.params, function (error, res) {
                        if (error) {
                            that.queue = [];
                            that.logger.log(4, [{sql: query.sql, params: query.params, error: error}]);
                            return reject(error);
                        }
                        that.logger.log(0, [{sql: query.sql, params: query.params, result: res}]);

                        result.push(res);
                        if (that.queue.length == 0) {
                            return resolve(result);
                        }
                        executeSql(that.queue.shift());
                    });
                }
                executeSql(that.queue.shift());
            });
        })
    }).then(function (result) {
        return that.dispatchEvent(DAO.EVENTS.AFTER_EXECUTE, [ result ]).then(function() { return result });
    });
};

DAO.Field = require('./field');
DAO.Join  = require('./join');
DAO.EVENTS = {
    BEFORE_EXECUTE : 'before-execute',
    AFTER_EXECUTE  : 'after-execute'
};

module.exports = DAO;