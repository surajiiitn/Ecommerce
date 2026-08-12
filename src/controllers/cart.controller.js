const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");

const addToCart = async (req, res) => {
    const userId = req.user._id;

    try {
        const { quantity } = req.body;
        const productId = req.body.productId || req.body.product;

        if (
            !productId ||
            !mongoose.Types.ObjectId.isValid(productId) ||
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid productId and quantity"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: "Quantity exceeds available stock"
            });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                items: []
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex > -1) {
            const newQuantity =
                cart.items[itemIndex].quantity + quantity;

            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: "Quantity exceeds available stock"
                });
            }

            cart.items[itemIndex].quantity = newQuantity;
        } else {
            cart.items.push({
                product: productId,
                quantity
            });
        }

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Product added to cart successfully",
            data: cart
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

const getCart = async (req, res) => {
    const userId = req.user._id;

    try {
        const cart = await Cart.findOne({
            user: userId
        }).populate("items.product");

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cart retrieved successfully",
            data: cart
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

const updateCart = async (req, res) => {
    const userId = req.user._id;

    try {
        const { quantity } = req.body;
        const productId = req.body.productId || req.body.product;

        if (
            !productId ||
            !mongoose.Types.ObjectId.isValid(productId) ||
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid productId and quantity"
            });
        }

        const cart = await Cart.findOne({
            user: userId
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        const productData = await Product.findById(productId);

        if (!productData) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (quantity > productData.stock) {
            return res.status(400).json({
                success: false,
                message: "Quantity exceeds available stock"
            });
        }

        cart.items[itemIndex].quantity = quantity;

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            data: cart
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

const removeFromCart = async (req, res) => {
    const userId = req.user._id;

    try {
        const { productId } = req.params;

        if (
            !productId ||
            !mongoose.Types.ObjectId.isValid(productId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid productId"
            });
        }

        const cart = await Cart.findOne({
            user: userId
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        cart.items.splice(itemIndex, 1);

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Product removed from cart successfully",
            data: cart
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

const deleteCart = async (req, res) => {
    const userId = req.user._id;

    try {
        const deletedCart = await Cart.findOneAndDelete({
            user: userId
        });

        if (!deletedCart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cart deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

module.exports = {
    addToCart,
    getCart,
    updateCart,
    removeFromCart,
    deleteCart
};
