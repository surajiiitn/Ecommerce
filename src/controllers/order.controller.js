const mongoose = require("mongoose");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Address = require("../models/address.model");

const { sendEmail } = require("../utils/email.js");

const createOrder = async (req, res) => {

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {

    const session = await mongoose.startSession();

    try {

      session.startTransaction();

      const userId = req.user._id || req.user.id;
      const { addressId } = req.body;

      const cart = await Cart.findOne({ user: userId })
        .populate("items.product")
        .session(session);

      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        });
      }

      const address = await Address.findOne({
        _id: addressId,
        user: userId,
      }).session(session);

      if (!address) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          message: "Address not found",
        });
      }

      let totalAmount = 0;

      for (const item of cart.items) {

        const product = item.product;

        if (!product) {
          await session.abortTransaction();

          return res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }

        if (item.quantity > product.stock) {
          await session.abortTransaction();

          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${product.name}`,
          });
        }

        totalAmount += product.price * item.quantity;
      }

      const orderItems = cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      for (const item of cart.items) {

        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.product._id,
            stock: {
              $gte: item.quantity,
            },
          },
          {
            $inc: {
              stock: -item.quantity,
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedProduct) {
          await session.abortTransaction();

          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${item.product.name}`,
          });
        }
      }

      const [order] = await Order.create(
        [
          {
            user: userId,
            products: orderItems,
            totalAmount,
            shippingAddress: {
              fullName: address.fullName,
              phone: address.phone,
              addressLine: address.addressLine,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
              country: address.country,
            },
          },
        ],
        {
          session,
        }
      );

      cart.items = [];

      await cart.save({
        session,
      });

      await session.commitTransaction();

      // send order confirmation email
      const subject = "Order Confirmation";
      const html = `
        <h1>Thank you for your order!</h1>
        <p>Your order has been successfully placed. Here are the details:</p>
        <ul>
          ${orderItems
            .map(
              (item) =>
                `<li>${item.quantity} x ${item.product.name} - $${item.price}</li>`
            )
            .join("")}
        </ul>
        <p>Total Amount: $${totalAmount}</p>
        <p>Shipping Address: ${address.fullName}, ${address.addressLine}, ${address.city}, ${address.state}, ${address.pincode}, ${address.country}</p>
      `;

      try {
        await sendEmail({ to: req.user.email, subject, html });
      } catch (err) {
        console.error("Error sending order confirmation email:", err.message);
      }

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });

    } catch (err) {

      try {
        await session.abortTransaction();
      } catch (abortError) {}

      const isTransientError =
        err.errorLabels &&
        err.errorLabels.includes("TransientTransactionError");

      const isWriteConflict =
        err.message &&
        err.message.includes("Write conflict");

      if (
        (isTransientError || isWriteConflict) &&
        attempt < MAX_RETRIES
      ) {
        console.log(
          `Transaction conflict. Retrying attempt ${attempt + 1}/${MAX_RETRIES}`
        );

        continue;
      }

      return res.status(500).json({
        success: false,
        message: err.message,
      });

    } finally {
      await session.endSession();
    }
  }

  return res.status(409).json({
    success: false,
    message:
      "Order could not be processed due to concurrent requests. Please try again.",
  });
};

const getMyOrders = async (req, res) => {
  try {
    const { id } = req.user;

    const orders = await Order.find({ user: id })
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getOrderbyId = async (req, res) => {
  const { id: orderId } = req.params;

  try {
    const filter = {
      _id: orderId,
    };

    if (req.user.role !== "admin") {
      filter.user = req.user.id;
    }

    const order = await Order.findOne(filter).populate("products.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const cancelOrder = async (req, res) => {
  const { id } = req.params;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findOne({
      _id: id,
      user: req.user.id,
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
        message: "Order is already cancelled",
      });
    }

    if (
      order.status === "shipped" ||
      order.status === "delivered"
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled",
      });
    }

    // Restore product stock
    for (const item of order.products) {
      const product = await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: item.quantity,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!product) {
        throw new Error(
          `Product not found: ${item.product}`
        );
      }
    }

    // Cancel order
    order.status = "cancelled";

    await order.save({ session });

    await session.commitTransaction();

    // send order cancellation email
    const subject = "Order Cancellation";
    const html = `
      <h1>Your order has been cancelled</h1>
      <p>Your order with ID ${order._id} has been successfully cancelled.</p>
      <p>If you have any questions, please contact our support team.</p>
    `;

    try {
      await sendEmail({ to: req.user.email, subject, html });
    } catch (err) {
      console.error(
        "Error sending order cancellation email:",
        err.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });

  } catch (err) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  } finally {
    session.endSession();
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "-password")
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is cancelled",
      });
    }

    order.status = status;

    await order.save();

    // send order status update email
    const subject = "Order Status Update";
    const html = `
      <h1>Your order status has been updated</h1>
      <p>Your order with ID ${order._id} is now ${status}.</p>
      <p>If you have any questions, please contact our support team.</p>
    `;

    try {
      await sendEmail({ to: order.user.email, subject, html });
    } catch (err) {
      console.error(
        "Error sending order status update email:",
        err.message
      );
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderbyId,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};