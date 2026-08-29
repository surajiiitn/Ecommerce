const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = async (filePath) => {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: 'ecommerce/products'
    });

    return {
        url: result.secure_url,
        publicId: result.public_id
    };
};

const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);
};

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary
};