#Introduction

Zatanna is a DAO realization for postgresql.

#Example

##Insert/Update/Delete data
```js
var Zatanna = require("zatanna");

var dao = new Zatanna(config, path);
dao.organizations.insert({ id : 1, name : 'Umbrella' });
dao.organizations.insert({ id : 2, name : 'Cyberdyne Systems' });
dao.execute().then(...).catch(...);

```

##Select

```js
var Zatanna = require("zatanna");

var dao = new Zatanna(config, path);
dao.organizations.select().then(...).catch(...);

```