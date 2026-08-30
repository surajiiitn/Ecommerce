const crypto = require("crypto");

const mongoose = require("mongoose");

const Order = require("../models/order.model");
const Payment = require("../models/payment.model");
const razorpay = require("../config/razorpay");
const { sendEmail } = require("../utils/email");

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

        if (order.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot create payment for cancelled order",
            });
        }

        if (order.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "Order is already paid",
            });
        }

        const existingPayment = await Payment.findOne({
            order: order._id,
            status: "created",
        });

        if (existingPayment) {
            return res.status(200).json({
                success: true,
                message: "Payment order already exists",
                data: {
                    paymentId: existingPayment._id,
                    orderId: order._id,
                    razorpayOrderId: existingPayment.gatewayOrderId,
                    amount: existingPayment.amount * 100,
                    currency: existingPayment.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                },
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
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const userId = req.user._id || req.user.id;

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const payment = await Payment.findOne({
            gatewayOrderId: razorpay_order_id,
            user: userId,
        }).session(session);

        if (!payment) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        if (payment.status === "paid") {
            await session.abortTransaction();

            return res.status(200).json({
                success: true,
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

        if (
            !crypto.timingSafeEqual(
                Buffer.from(expectedSignature),
                Buffer.from(razorpay_signature || "")
            )
        ) {
            payment.status = "failed";

            await payment.save({ session });

            await session.commitTransaction();

            // send payment failure email
            const subject = "Payment Failed";
            const html = `
                <h1>Payment Failed</h1>
                <p>Your payment for order ${payment.order} has failed. Please try again or contact support.</p>
            `;

            try {
                await sendEmail({ to: req.user.email, subject, html });
            } catch (err) {
                console.error("Error sending payment failure email:", err.message);
            }
            
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature",
            });
        }

        const order = await Order.findOne({
            _id: payment.order,
            user: userId,
        }).session(session);

        if (!order) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.status === "cancelled") {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Cannot process payment for cancelled order",
            });
        }

        payment.gatewayPaymentId = razorpay_payment_id;
        payment.gatewaySignature = razorpay_signature;
        payment.status = "paid";

        await payment.save({ session });

        order.paymentStatus = "paid";
        order.status = "processing";

        await order.save({ session });

        await session.commitTransaction();

        // send payment confirmation email
        const subject = "Payment Confirmation";
        const html = `
            <h1>Payment Successful!</h1>
            <p>Your payment for order ${order._id} has been successfully processed.</p>
            <p>Thank you for shopping with us!</p>
        `;

        try {
            await sendEmail({ to: req.user.email, subject, html });
        } catch (err) {
            console.error("Error sending payment confirmation email:", err.message);
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            data: {
                payment,
                order,
            },
        });

    } catch (err) {
        await session.abortTransaction();

        return res.status(500).json({
            success: false,
            message: err.message,
        });

    } finally {
        await session.endSession();
    }
};

const handleWebhook = async (req, res) => {
    const session = await mongoose.startSession();

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

        if (
            !crypto.timingSafeEqual(
                Buffer.from(expectedSignature),
                Buffer.from(signature)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid webhook signature",
            });
        }

        const event = JSON.parse(req.body.toString());

        if (event.event === "payment.captured") {
            const paymentEntity = event.payload.payment.entity;

            const razorpayOrderId = paymentEntity.order_id;
            const razorpayPaymentId = paymentEntity.id;

            session.startTransaction();

            const payment = await Payment.findOne({
                gatewayOrderId: razorpayOrderId,
            }).session(session);

            if (!payment) {
                await session.abortTransaction();

                return res.status(404).json({
                    success: false,
                    message: "Payment not found",
                });
            }

            if (payment.status === "paid") {
                await session.abortTransaction();

                return res.status(200).json({
                    success: true,
                    message: "Payment already processed",
                });
            }

            const order = await Order.findById(payment.order).session(session);

            if (!order) {
                await session.abortTransaction();

                return res.status(404).json({
                    success: false,
                    message: "Order not found",
                });
            }

            if (order.status === "cancelled") {
                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message: "Cannot process payment for cancelled order",
                });
            }

            payment.gatewayPaymentId = razorpayPaymentId;
            payment.status = "paid";

            await payment.save({ session });

            order.paymentStatus = "paid";
            order.status = "processing";

            await order.save({ session });

            await session.commitTransaction();
        }

        return res.status(200).json({
            success: true,
            message: "Webhook processed successfully",
        });

    } catch (err) {
        await session.abortTransaction();

        console.error("Webhook error:", err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });

    } finally {
        await session.endSession();
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
    handleWebhook,
};