var Promise = require("bluebird");

module.exports = function(obj) {
    obj.handlers = {};

    obj.on = function(type, handler) {
        if (!obj.handlers[type]) {
            obj.handlers[type] = [];
        }
        obj.handlers[type].push(handler);
    };

    obj.unbind = function(type, handler) {
        var handlers = obj.handlers[type];
        if (!handlers) { return; }
        var index = handlers.indexOf(handler);
        if (index < 0) { return; }
        handlers.splice(index, 1);
    };

    obj.dispatchEvent = function(type, args) {
        var handlers = (obj.handlers[type] || []).slice();
        return Promise.resolve().then(function callHandler() {
            var handler = handlers.shift();
            return handler ? Promise.resolve(handler.apply(obj, cloneArgs(args))).then(callHandler) : null;
        });
    };
};

function cloneArgs(args) {
    if (!args) { return null; }
    var result = { length : args.length };
    for (var i = 0; i < args.length; i++) { result[i] = args[i]; }
    return result;
}