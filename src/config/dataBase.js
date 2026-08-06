const mongoose = require('mongoose');

const connectDB = async () => {
    try{
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined');
        }

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });

        console.log(`MongoDB Connected Successfully:`);
    }catch(err){
        console.error(err.message);
        console.log('MongoDB Connection Failed');

        process.exit(1);
    }
};

module.exports = connectDB;
