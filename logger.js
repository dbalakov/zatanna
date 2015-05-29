//Logger LEVELS
//ALL   : 0
//DEBUG : 1
//INFO  : 2
//WARN  : 3
//ERROR : 4

var LEVELS = [ 'log', 'debug', 'info', 'warn', 'error' ];

function Logger() {
}

Logger.prototype.set = function(logger, level) {
    this.logger = logger;
    this.level  = level;
};

Logger.prototype.log = function(level, args) {
    if (!this.logger || level < this.level) {
        return;
    }

    if (this.logger && this.logger[LEVELS[level]]) {
        this.logger[LEVELS[level]].apply(this.logger, args);
    }
};

module.exports = Logger;