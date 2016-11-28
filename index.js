var Promise = require("bluebird");
var pg      = require("pg");
var QueryStream = require('pg-query-stream');

var Factory = require("./instance/factory");
var Logger  = require("./logger");
var Events  = require("./events");

var TIMESTAMP_WOTZ = 1114; // timestamp without time zone
var DATE_PARSER = pg.types.getTypeParser(TIMESTAMP_WOTZ);

pg.types.setTypeParser(TIMESTAMP_WOTZ, function(val) {
    if (val === null) { return null; }

    var parsedDate = DATE_PARSER(val);

    return new Date(parsedDate - parsedDate.getTimezoneOffset() * 60 * 1000);
});

function DAO(config, path) {
    this.config = config;
    this.queue  = [];
    this.logger = new Logger();
    this.maxRetries = config.maxRetries || 3;
    this.delay = config.delay || 100;

    Events(this);

    if (path) {
        Factory.get(path).createInstances(this);
    }
}

DAO.prototype.createClient = function(onConnection) {
    var that = this;
    var retries = 0;
    function connect () {
        return new Promise(function(resolve, reject) {
            var client = new pg.Client(that.config);
            client.connect(function(error) {
                if (error) {
                    if (retries++ >= that.maxRetries) {
                        that.logger.log(4, [ error ]);
                        return reject(error);
                    }
                    return Promise.delay(that.delay * (0.5 + Math.random())).then(connect).then(resolve).catch(reject);
                }

                that.logger.log(0, [ 'Connected' ]);

                if (onConnection) {
                    var query = client.query(onConnection.sql, onConnection.params);
                    var result = [];

                    query.on('row', function (row) {
                        result.push(row);
                    });

                    query.on('error', function (error) {
                        that.logger.log(4, [{sql: onConnection.sql, params: onConnection.params, error: error}]);
                        reject(error);
                    });

                    query.on('end', function () {
                        that.logger.log(0, [{sql: onConnection.sql, params: onConnection.params, result: result}]);
                        resolve(client);
                    });
                } else {
                    resolve(client);
                }
            });
        })
    }

    return connect().disposer(function (client) {
        client.end();
        that.logger.log(0, [ 'Disconnected' ]);
    });
};

DAO.prototype.select = function(sql, params, onConnection) {
    var that = this;
    return Promise.using(that.createClient(onConnection), function(client) {
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

DAO.prototype.selectOne = function(sql, params, onConnection) {
    return this.select(sql, params, onConnection).then(function(result) { return result[0]; });
};

DAO.prototype.selectStream = function(sql, params) {
    var that = this;

    return new Promise(function(resolve, reject) {
        pg.connect(that.config, function(error, client, done) {
            if (error) { that.logger.log(4, [error]); return reject(error); }

            var readable = client.query(new QueryStream(sql, params))

            readable.on('error', function(error) {
                done();
                that.logger.log(4, [{sql: sql, params: params, error: error}]);
            });

            readable.on('end', done);

            resolve(readable);
        });
    });
};

DAO.prototype.executeSql = function(sql, params) {
    this.queue.push({ sql : sql, params : params });
};

DAO.prototype.execute = function(useTransaction) {
    function executeSql(query) {
        var self = this;
        return self.client.queryAsync(query.sql, query.params).then(function (res) {
            that.logger.log(0, [{sql: query.sql, params: query.params, result: res}]);

            self.result.push(res);
            if (that.queue.length === 0) {
                return self.result;
            }
            return executeSql.call(self, that.queue.shift());
        }).catch(function (error) {
            that.queue = [];
            that.logger.log(4, [{sql: query.sql, params: query.params, error: error}]);
            if (useTransaction) {
                return executeSql.call(self, { sql: 'ROLLBACK;' }).then(function () {
                    throw error;
                });
            }

            throw error;
        });
    }

    var that = this;

    if (useTransaction) {
        that.queue.unshift({ sql: 'BEGIN TRANSACTION;' });
        that.queue.push({ sql: 'COMMIT;' });
    }

    return Promise.using(that.createClient(), function(callbackClient) {
        var environment = {
            result : [],
            client : Promise.promisifyAll(callbackClient)
        };
        return that.dispatchEvent(DAO.EVENTS.BEFORE_EXECUTE).then(function() {
            return that.queue.length === 0 ? [] : executeSql.call(environment, that.queue.shift());
        });
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