const cloudinary = require("../config/cloudinary");

const testCloudinary = async () => {
    try {
        const result = await cloudinary.api.ping();

        console.log("Cloudinary connected successfully");
        console.log(result);
    } catch (error) {
        console.error("Cloudinary connection failed");
        console.error("Message:", error.message);
        console.error("Full error:", error);
    }
};

testCloudinary();