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
const { orderStatusValidator } = require('../validators/order.validator');

router.post("/", protect, createOrder);
router.get("/", protect, getMyOrders);
router.get("/:id", protect, getOrderbyId);
router.put("/:id/cancel", protect, cancelOrder);
router.get("/admin/all", protect, authorize(["admin"]), getAllOrders);
router.put("/:id/status", protect, authorize(["admin"]),orderStatusValidator,validate, updateOrderStatus);

module.exports = router;
