const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = require("./app");
const connectDB = require("./config/dataBase");
const PORT = process.env.PORT || 3000;

const startServer = async () => {

    try {

        await connectDB();

        app.listen(PORT, () => {
            console.log(`🚀 Server Running On Port ${PORT}`);
        });
    } catch (err) {
        console.error(err);
    }

};

startServer();
