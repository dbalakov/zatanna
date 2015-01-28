#Introduction

node-dao is a DAO realization for postgresql.

#Example

##Insert/Update/Delete data
```js
var DAO = require("DAO");

var dao = new DAO(config, path);
dao.organizations.insert({ id : 1, name : 'Umbrella' });
dao.organizations.insert({ id : 2, name : 'Cyberdyne Systems' });
dao.execute().then(...).catch(...);

```

##Select

```js
var DAO = require("DAO");

var dao = new DAO(config, path);
dao.organizations.select().then(...).catch(...);

```