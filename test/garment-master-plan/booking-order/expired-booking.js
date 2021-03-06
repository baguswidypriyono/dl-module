require("should");
var ObjectId = require("mongodb").ObjectId;
var should = require('should');
var helper = require("../../helper");
var Manager = require("../../../src/managers/garment-master-plan/booking-order-manager");
var manager = null;
var dataUtil =require("../../data-util/garment-master-plan/booking-order-data-util");
var validate = require("dl-models").validator.garmentMasterPlan.bookingOrder;

var ManagerPlan = require("../../../src/managers/garment-master-plan/sewing-blocking-plan-manager");
var managerPlan = null;
var dataUtilPlan =require("../../data-util/garment-master-plan/sewing-blocking-plan-data-util");
var validatePlan = require("dl-models").validator.garmentMasterPlan.masterPlan;

var moment = require('moment');

before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            manager = new Manager(db, {
                username: 'dev'
            });
            managerPlan = new ManagerPlan(db, {
                username: 'unit-test'
            });
            done();
        })
        .catch(e => {
            done(e);
        });
});

var createdId;
it("#01. should success when create new data", function (done) {
    dataUtil.getNewData()
        .then((data) =>{ 
            data.orderQuantity=5000;
            manager.create(data)
            .then((id) => {
                id.should.be.Object();
                createdId = id;
                done();
        })
        })
        .catch((e) => {
            done(e);
        });
});


var createdData;
it(`#02. should success when get created data with id`, function (done) {
    manager.getSingleById(createdId)
        .then((data) => {
            data.should.instanceof(Object);
            validate(data);
            createdData = data;
            done();
        })
        .catch((e) => {
            done(e);
        });
});

var createdPlanId;
var createdPlan;
it("#03. should success when create new data blocking plan", function (done) {
    dataUtilPlan.getNewData()
        .then((data) =>{ 
            data.bookingOrderId=createdId;
            data.deliveryDate=createdData.deliveryDate;
            for(var detail of data.details){
                detail.deliveryDate=createdData.deliveryDate;
            }
            managerPlan.create(data)
            .then((id) => {
                id.should.be.Object();
                createdPlanId = id;
                done();
        })
        })
        .catch((e) => {
            done(e);
        });
});

it('#04. should success when hapus sisa', function(done) {
    manager.expiredBooking(createdData)
        .then(booking => {
            //var bookingId = booking._id;
            manager.getSingleById(booking)
                .then(book => {
                    var booking = book;
                    validate(booking);
                    booking.expiredBookingOrder.should.not.equal(0);
                    done();
                })
                .catch(e => {
                    done(e);
                });
        })
        .catch(e => {
            done(e);
        });
});

let createdExpiredBookingOrder;
it("#05. should success when create new expired booking order", function (done) {
    dataUtil.getNewData()
        .then((newData) => {
            newData.items = [];
            newData.orderQuantity = 5000;
            manager.create(newData)
                .then((id) => {
                    id.should.be.Object();
                    manager.getSingleById(id)
                        .then((createdData) => {
                            createdData.deliveryDate.setDate(createdData.deliveryDate.getDate() - 45);
                            manager.collection.update(createdData)
                                .then((idCreatedData) => {
                                    idCreatedData.should.instanceof(Object);
                                    manager.getSingleById(idCreatedData)
                                        .then((updatedData) => {
                                            updatedData.should.instanceof(Object);

                                            let duration = (updatedData.deliveryDate - new Date()) / 86400000;
                                            duration.should.belowOrEqual(45);

                                            let itemsQuantity = updatedData.items.reduce((acc, cur) => acc + cur.quantity, 0);
                                            updatedData.orderQuantity.should.above(itemsQuantity);

                                            createdExpiredBookingOrder = updatedData;
                                            done();
                                        })
                                        .catch((e) => {
                                            done(e)
                                        });
                                })
                                .catch((e) => {
                                    done(e)
                                });
                        })
                        .catch((e) => {
                            done(e)
                        });
                })
                .catch((e) => {
                    done(e)
                });
        })
        .catch((e) => {
            done(e);
        });
});

let createdExpiredBookingOrderList;
it(`#06. should success when get expired booking order`, function (done) {
    let paging = {
        select: ["code"],
        keyword: createdExpiredBookingOrder.code,
        order: { _updatedDate: -1 }
    };
    manager.getAllExpiredBookingOrder(paging)
        .then((result) => {
            result.should.instanceof(Object);
            result.data.should.instanceof(Object);
            result.data.length.should.above(0);
            createdExpiredBookingOrderList = result.data;
            done();
        })
        .catch((e) => {
            done(e);
        });
});

it('#07. should success when delete remaining all expired booking order', function(done) {
    manager.deleteRemainingAllExpiredBookingOrder(createdExpiredBookingOrderList)
        .then(idBookingOrderList => {
            let jobGetBookingOrderList = idBookingOrderList.map(id => manager.getSingleById(id));
            Promise.all(jobGetBookingOrderList)
                .then(bookingOrderList => {
                    for (const bookingOrder of bookingOrderList) {
                        bookingOrder.expiredBookingOrder.should.not.equal(0);
                    }
                    done();
                })
                .catch(e => {
                    done(e);
                });
        })
        .catch(e => {
            done(e);
        });
});

it('#07.1 should error when delete remaining all expired booking order with no data', function(done) {
    manager.deleteRemainingAllExpiredBookingOrder([])
        .then(() => {
            done("should error when delete remaining all expired booking order with no data")
        })
        .catch(e => {
            e.should.instanceof(Object);
            e.should.have.property("errors");
            e.errors.should.instanceof(Object);
            done();
        });
});
