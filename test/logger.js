var cwd = process.cwd();

var assert = require("chai").assert;
var sinon  = require("sinon");

var Logger = require(cwd + '/logger');

describe('Logger', function() {
    it('setLogger', function () {
        var logger = new Logger();

        logger.set(console, 3);

        assert.equal(logger.logger, console, 'logger');
        assert.equal(logger.level, 3, 'level');
    });

    it("log don't call logger methods if level > logLevel", function() {
        var logger = createLogger(3);

        logger.log(0, []);

        assert(logger.logger.log.notCalled,   'log');
        assert(logger.logger.debug.notCalled, 'debug');
        assert(logger.logger.info.notCalled,  'info');
        assert(logger.logger.warn.notCalled,  'warn');
        assert(logger.logger.error.notCalled, 'error');
    });

    it("log with level 0 call logger.log", function() {
        var logger = createLogger(0);

        logger.log(0, []);

        assert(logger.logger.log.calledOnce,   'log');
        assert(logger.logger.debug.notCalled, 'debug');
        assert(logger.logger.info.notCalled,  'info');
        assert(logger.logger.warn.notCalled,  'warn');
        assert(logger.logger.error.notCalled, 'error');
    });

    it("log with level 1 call logger.debug", function() {
        var logger = createLogger(0);

        logger.log(1, []);

        assert(logger.logger.log.notCalled,   'log');
        assert(logger.logger.debug.calledOnce, 'debug');
        assert(logger.logger.info.notCalled,  'info');
        assert(logger.logger.warn.notCalled,  'warn');
        assert(logger.logger.error.notCalled, 'error');
    });

    it("log with level 2 call logger.info", function() {
        var logger = createLogger(0);

        logger.log(2, []);

        assert(logger.logger.log.notCalled,   'log');
        assert(logger.logger.debug.notCalled, 'debug');
        assert(logger.logger.info.calledOnce,  'info');
        assert(logger.logger.warn.notCalled,  'warn');
        assert(logger.logger.error.notCalled, 'error');
    });

    it("log with level 3 call logger.warn", function() {
        var logger = createLogger(0);

        logger.log(3, []);

        assert(logger.logger.log.notCalled,   'log');
        assert(logger.logger.debug.notCalled, 'debug');
        assert(logger.logger.info.notCalled,  'info');
        assert(logger.logger.warn.calledOnce,  'warn');
        assert(logger.logger.error.notCalled, 'error');
    });

    it("log with level 4 call logger.error", function() {
        var logger = createLogger(0);

        logger.log(4, []);

        assert(logger.logger.log.notCalled,   'log');
        assert(logger.logger.debug.notCalled, 'debug');
        assert(logger.logger.info.notCalled,  'info');
        assert(logger.logger.warn.notCalled,  'warn');
        assert(logger.logger.error.calledOnce, 'error');
    });
});

function createLogger(level) {
    var result = new Logger();
    result.set({
        log   : sinon.spy(),
        debug : sinon.spy(),
        info  : sinon.spy(),
        warn  : sinon.spy(),
        error : sinon.spy()
    }, level);
    return result;
}