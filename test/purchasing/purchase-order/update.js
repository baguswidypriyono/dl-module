require("should");
var helper = require("../../helper");

var purchaseRequestDataUtil = require("../../data-util/purchasing/purchase-request-data-util");
var validatePR = require("dl-models").validator.purchasing.purchaseRequest;
var PurchaseRequestManager = require("../../../src/managers/purchasing/purchase-request-manager");
var purchaseRequestManager = null;
var purchaseRequest;

var purchaseOrderDataUtil = require("../../data-util/purchasing/purchase-order-data-util");
var validatePO = require("dl-models").validator.purchasing.purchaseOrder;
var PurchaseOrderManager = require("../../../src/managers/purchasing/purchase-order-manager");
var purchaseOrderManager = null;
var purchaseOrder;

before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            purchaseRequestManager = new PurchaseRequestManager(db, {
                username: 'dev'
            });
            purchaseOrderManager = new PurchaseOrderManager(db, {
                username: 'dev'
            });

            purchaseOrderDataUtil.getNewTestData()
                .then(po => {
                    purchaseOrder = po;
                    validatePO(purchaseOrder);
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

it('#01. should success when update purchase-order', function(done) {
    purchaseOrderManager.update(purchaseOrder)
        .then((id) => {
            return purchaseOrderManager.getSingleById(id);
        })
        .then(po => {
            done();
        })
        .catch(e => {
            done(e);
        });
});

it('#02. purchase-request.purchaseOrderIds should contains purchaseOrder._id', function(done) {
    var prId = purchaseOrder.purchaseRequestId;
    purchaseRequestManager.getSingleById(prId)
        .then(pr => {
            purchaseRequest = pr;
            validatePR(purchaseRequest);
            var notFound = !purchaseRequest.purchaseOrderIds.find((poId) => poId.toString() === purchaseOrder._id.toString());
            notFound.should.equal(false);
            done();
        })
        .catch(e => {
            done(e);
        });
});

it('#03. purchase-order items should the same as purchase-request items', function(done) {
    purchaseOrder.items.length.should.equal(purchaseRequest.items.length);
    for (var poItem of purchaseOrder.items) {
        var prItem = purchaseRequest.items.find(prItem => {
            return poItem.product._id.toString() == prItem.product._id.toString();
        });
        prItem.should.not.equal(null, "an item in purchase-order not found in purchase-request");
        poItem.defaultQuantity.should.equal(prItem.quantity, "purchase-order-item.defaultQuantity does not equal purchase-request-item.quantity");
        poItem.defaultUom._id.toString().should.equal(prItem.product.uom._id.toString(), "purchase-order-item.defaultUom does not equal purchase-request-item.product.uom");
    }
    done();
});
