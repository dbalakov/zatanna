function Instance(dao, description) {
    this.dao         = dao;
    this.description = description;

    this.conditions = {};
    require("./conditions").createEqual(this.conditions, description);
}

require("./insert")(Instance);
require("./update")(Instance);
require("./delete")(Instance);
require("./select")(Instance);

module.exports = Instance;