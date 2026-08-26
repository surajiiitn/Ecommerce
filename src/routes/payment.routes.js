const express = require("express");

const router = express.Router();

const {
    createPaymentOrder,
    verifyPayment,
} = require("../controllers/payment.controller");

const { protect } = require("../middlewares/auth.middleware");

router.post(
    "/create",
    protect,
    createPaymentOrder
);

router.post(
    "/verify",
    protect,
    verifyPayment
);

module.exports = router;