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

    obj.dispatchEvent = function(type) {
        if (!obj.handlers[type]) { return; }
        obj.handlers[type].forEach(function(handler) { handler(); });
    };
};