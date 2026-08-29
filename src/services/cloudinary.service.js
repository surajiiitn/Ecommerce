const cloudinary = require("../config/cloudinary");

const uploadImage = (buffer, folder = "ecommerce/products") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );

        stream.end(buffer);
    });
};

const deleteImage = async (publicId) => {
    return cloudinary.uploader.destroy(publicId);
};

module.exports = {
    uploadImage,
    deleteImage,
};