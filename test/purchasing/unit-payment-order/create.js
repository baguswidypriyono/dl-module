var helper = require("../../helper");
var validator = require('dl-models').validator.master;
var validatorPurchasing = require('dl-models').validator.purchasing;
var UnitPaymentOrderManager = require("../../../src/managers/purchasing/unit-payment-order-manager");
var unitPaymentOrderManager = null;
var unitPaymentOrder = require("../../data-util/purchasing/unit-payment-order-data-util");

require("should");

before('#00. connect db', function (done) {
    helper.getDb()
        .then((db) => {
            unitPaymentOrderManager = new UnitPaymentOrderManager(db, {
                username: 'unit-test'
            });
            done();
        })
        .catch(e => {
            done(e);
        })
});

var createdId;var createdData;
it('#01. should success when create new data', function (done) {
    unitPaymentOrder.getNewData()
        .then((data) => {unitPaymentOrderManager.create(data); createdData=data;})
        .then((id) => {
            id.should.be.Object();
            createdId = id;
            done();
        })
        .catch((e) => {
            done(e);
        });
});

it('#02. should error when create new blank data', function (done) {
    unitPaymentOrderManager.create({})
        .then((id) => {
            id.should.be.Object();
            done();
        })
        .catch(e => {
            try {
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});

it("#03. should success when search data with filter", function (done) {
    unitPaymentOrderManager.read({
        keyword: createdData.supplier.name
    })
        .then((documents) => {
            //process documents
            documents.should.have.property("data");
            documents.data.should.be.instanceof(Array);
            documents.data.length.should.not.equal(0);
            done();
        })
        .catch((e) => {
            done(e);
        });
});