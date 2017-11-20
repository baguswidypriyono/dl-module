var options = {
    manager: require("../../../src/managers/master/garment-category-manager"),
    model: require("dl-models").master.Category,
    util: require("../../data-util/master/garment-category-data-util"),
    validator: require("dl-models").validator.master.category,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../basic-test-factory");
basicTest(options);
