const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        currency: {
            type: String,
            default: "INR",
        },

        gateway: {
            type: String,
            default: "razorpay",
        },

        gatewayOrderId: {
            type: String,
            required: true,
        },

        gatewayPaymentId: {
            type: String,
            default: null,
        },

        gatewaySignature: {
            type: String,
            default: null,
        },

        status: {
            type: String,
            enum: [
                "created",
                "paid",
                "failed",
                "refunded",
            ],
            default: "created",
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ gatewayOrderId: 1 }, { unique: true });
paymentSchema.index({ gatewayPaymentId: 1 }, { sparse: true });

module.exports = mongoose.model("Payment", paymentSchema);