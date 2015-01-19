var cwd = process.cwd();

var fs = require('fs');

var env = process.env.NODE_ENV || 'testing';

var result = { env : env };
var files = fs.readdirSync(cwd + "/test/env/config/" + env).filter(function(file) { return file[0] !== '.'; });

for (var i = 0; i < files.length; i++) {
    var file = files[i];
    result[file.slice(0, file.indexOf('.'))] = require(cwd + "/test/env/config/" + env + "/" + file);
}

module.exports = result;