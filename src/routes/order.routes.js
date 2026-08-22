const express = require("express");
const router = express.Router();

const {
  createOrder,
    getMyOrders,
    getOrderbyId,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
} = require("../controllers/order.controller");


const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { createOrderValidator, orderIdValidator, orderStatusValidator } = require('../validators/order.validator');

router.post("/", protect, createOrderValidator, validate, createOrder);
router.get("/", protect, getMyOrders);
router.get("/admin/all", protect, authorize(["admin"]), getAllOrders);
router.get("/:id", protect, orderIdValidator, validate, getOrderbyId);
router.put("/:id/cancel", protect, orderIdValidator, validate, cancelOrder);
router.put("/:id/status", protect, authorize(["admin"]), orderIdValidator, orderStatusValidator, validate, updateOrderStatus);

module.exports = router;
