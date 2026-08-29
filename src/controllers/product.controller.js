const Product = require("../models/product.model");
const mongoose = require("mongoose");
const {
    uploadToCloudinary,
    deleteFromCloudinary
} = require('../utils/cloudinary');


const createProduct = async (req, res) => {
    try {

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to create a product"
            });
        }

        const {
            name,
            description,
            price,
            category,
            stock
        } = req.body;

        let imageUrl = null;
        let imagePublicId = null;

        // Upload image to Cloudinary
        if (req.file) {

            const uploadedImage = await uploadToCloudinary(
                req.file.path
            );

            imageUrl = uploadedImage.url;
            imagePublicId = uploadedImage.publicId;
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            stock,
            imageUrl,
            imagePublicId
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });

    } catch (err) {

        console.error("Create product error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });

    }
};

const getAllProducts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const search = req.query.search || "";
        const category = req.query.category || "";

        const minPrice = Number(req.query.minPrice) || 0;
        const maxPrice =
            Number(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

        const filter = {};

        if (search) {
            filter.name = {
                $regex: search,
                $options: "i"
            };
        }

        if (category) {
            filter.category = category;
        }

        filter.price = {
            $gte: minPrice,
            $lte: maxPrice
        };

        const totalProducts = await Product.countDocuments(filter);

        const products = await Product.find(filter)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            message:
                products.length === 0
                    ? "No products found"
                    : "Products found",
            data: products,
            pagination: {
                page,
                limit,
                totalProducts,
                totalPages: Math.ceil(totalProducts / limit),
                hasNextPage: page < Math.ceil(totalProducts / limit),
                hasPreviousPage: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

const getProductById = async (req, res) => {
    const { id } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product found",
            data: product
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;

    try {

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this product"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const {
            name,
            description,
            price,
            category,
            stock
        } = req.body;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Update normal fields
        if (name !== undefined) {
            product.name = name;
        }

        if (description !== undefined) {
            product.description = description;
        }

        if (price !== undefined) {
            product.price = price;
        }

        if (category !== undefined) {
            product.category = category;
        }

        if (stock !== undefined) {
            product.stock = stock;
        }

        // If a new image is uploaded
        if (req.file) {

            // Delete old Cloudinary image
            if (product.imagePublicId) {
                await deleteFromCloudinary(
                    product.imagePublicId
                );
            }

            // Upload new image
            const uploadedImage =
                await uploadToCloudinary(req.file.path);

            product.imageUrl = uploadedImage.url;
            product.imagePublicId = uploadedImage.publicId;
        }

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });

    } catch (err) {

        console.error("Update product error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this product"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Delete image from Cloudinary
        if (product.imagePublicId) {
            await deleteFromCloudinary(product.imagePublicId);
        }

        // Delete product from MongoDB
        await Product.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: product
        });

    } catch (err) {

        console.error("Delete product error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
