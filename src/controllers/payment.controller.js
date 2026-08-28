const crypto = require("crypto");

const Order = require("../models/order.model");
const Payment = require("../models/payment.model");
const razorpay = require("../config/razorpay");

const createPaymentOrder = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { orderId } = req.body;

        const order = await Order.findOne({
            _id: orderId,
            user: userId,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "Order is already paid",
            });
        }

        const amount = order.totalAmount * 100;

        const razorpayOrder = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt: order._id.toString(),
        });

        const payment = await Payment.create({
            user: userId,
            order: order._id,
            amount: order.totalAmount,
            currency: "INR",
            gateway: "razorpay",
            gatewayOrderId: razorpayOrder.id,
            status: "created",
        });

        return res.status(201).json({
            success: true,
            message: "Payment order created successfully",
            data: {
                paymentId: payment._id,
                orderId: order._id,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_KEY_ID,
            },
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


const verifyPayment = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const payment = await Payment.findOne({
            gatewayOrderId: razorpay_order_id,
            user: userId,
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        // Idempotency protection
        if (payment.status === "paid") {
            return res.status(400).json({
                success: false,
                message: "Payment already processed",
            });
        }

        const body =
            razorpay_order_id +
            "|" +
            razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            payment.status = "failed";

            await payment.save();

            return res.status(400).json({
                success: false,
                message: "Invalid payment signature",
            });
        }

        payment.gatewayPaymentId = razorpay_payment_id;
        payment.gatewaySignature = razorpay_signature;
        payment.status = "paid";

        await payment.save();

        const order = await Order.findById(payment.order);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        order.paymentStatus = "paid";
        order.status = "processing";

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            data: {
                payment,
                order,
            },
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];

        if (!signature) {
            return res.status(400).json({
                success: false,
                message: "Webhook signature missing",
            });
        }

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_WEBHOOK_SECRET
            )
            .update(req.body)
            .digest("hex");

        if (signature !== expectedSignature) {
            return res.status(400).json({
                success: false,
                message: "Invalid webhook signature",
            });
        }

        const event = JSON.parse(req.body.toString());

        console.log(
            "Razorpay webhook event:",
            event.event
        );

        if (event.event === "payment.captured") {
            const paymentEntity = event.payload.payment.entity;

            const razorpayOrderId = paymentEntity.order_id;
            const razorpayPaymentId = paymentEntity.id;

            /*
             * Atomic update
             *
             * Only a payment which is NOT already paid
             * can be changed to paid.
             */
            const payment = await Payment.findOneAndUpdate(
                {
                    gatewayOrderId: razorpayOrderId,
                    status: { $ne: "paid" },
                },
                {
                    $set: {
                        gatewayPaymentId: razorpayPaymentId,
                        status: "paid",
                    },
                },
                {
                    new: true,
                }
            );

            /*
             * Payment was not updated.
             *
             * It can mean:
             * 1. Payment doesn't exist
             * 2. Payment was already processed
             */
            if (!payment) {
                const existingPayment = await Payment.findOne({
                    gatewayOrderId: razorpayOrderId,
                });

                if (!existingPayment) {
                    return res.status(404).json({
                        success: false,
                        message: "Payment not found",
                    });
                }

                if (existingPayment.status === "paid") {
                    return res.status(200).json({
                        success: true,
                        message: "Payment already processed",
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: "Payment could not be processed",
                });
            }

            /*
             * Payment successfully changed:
             *
             * created → paid
             */
            const order = await Order.findById(payment.order);

            if (order) {
                order.paymentStatus = "paid";
                order.status = "processing";

                await order.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Webhook processed successfully",
        });

    } catch (err) {
        console.error("Webhook error:", err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


module.exports = {
    createPaymentOrder,
    verifyPayment,
    handleWebhook,
};