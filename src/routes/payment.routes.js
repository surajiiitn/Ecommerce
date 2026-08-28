const express = require("express");

const router = express.Router();

const {
    createPaymentOrder,
    verifyPayment,
    handleWebhook
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

router.post(
    "/webhook",
    handleWebhook
);

module.exports = router;