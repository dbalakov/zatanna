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
        return new Promise(function(resolve, reject) {
            if (!obj.handlers[type]) { return resolve(); }
            var handlers = obj.handlers[type].slice();

            (function callHandler() {
                if (handlers.length == 0) { return resolve(); }
                Promise.resolve(handlers.shift().apply(obj, cloneArgs(args))).then(callHandler).catch(reject);
            })();
        });
    };
};

function cloneArgs(args) {
    if (!args) { return null; }
    var result = { length : args.length };
    for (var i = 0; i < args.length; i++) {
        result[i] = args[i];
    }
    return result;
}