const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const healthRoutes = require("./routes/health.routes");
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

/* ---------------- Middleware ---------------- */

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

/* ---------------- Routes ---------------- */


// -- Health Routes 
app.use("/api/v1/health", healthRoutes);
// -- Auth Routes
app.use("/api/v1/auth", authRoutes);
// -- User Routes 
app.use("/api/v1/user",userRoutes);

/* ---------------- 404 ---------------- */

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "Route Not Found"
    });

});

module.exports = app;