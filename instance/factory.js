var require_directory = require('require-directory');

var Instance          = require('./');

function Factory(path) {
    this.path = path;
    this.models = require_directory(module, path);
}

Factory.instances = {};

Factory.get = function(path) {
    if (Factory.instances[path]) {
        return Factory.instances[path];
    }
    var result = new Factory(path);
    Factory.instances[path] = result;
    return result;
};

Factory.prototype.createInstance = function(dao, description, injection) {
    var result = new Instance(dao, description);

    if (injection && injection.conditions) {
        for (var name in injection.conditions) {
            result.conditions[name] = injection.conditions[name].bind(result);
        }
    }

    if (injection && injection.methods) {
        for (var name in injection.methods) {
            result[name] = injection.methods[name].bind(result);
        }
    }

    return result;
};

Factory.prototype.createInstances = function(dao) {
    for (var name in this.models) {
        var model = this.models[name];
        dao[name] = this.createInstance(dao, model.index, model);
    }
}

module.exports = Factory;