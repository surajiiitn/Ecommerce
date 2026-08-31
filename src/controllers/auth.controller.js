const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const {generateAccessToken,generateRefreshToken,hashRefreshToken} = require('../utils/generateToken');
const { sendEmail } = require("../utils/email");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // Send welcome email
        const subject = "Welcome to Our E-commerce Platform!";
        const html = `
            <h1>Welcome, ${name}!</h1>
            <p>Thank you for registering on our platform. We're excited to have you on board!</p>
            <p>Happy shopping!</p>
        `;
        
        try{
            await sendEmail({ to: email, subject, html });
        }catch(err){
            console.error("Error sending welcome email:", err.message);
        }
        

        user.password = undefined;

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // send login notification email
        const subject = "Login Notification";
        const html = `
            <h1>Hello, ${user.name}!</h1>
            <p>We noticed a login to your account. If this was you, no action is needed. If you did not log in, please secure your account immediately.</p>
        `;

        try{
            await sendEmail({ to: email, subject, html });
        }catch(err){
            console.error("Error sending login notification email:", err.message);
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        const hashedRefreshToken = await hashRefreshToken(refreshToken);
        
        user.refreshTokenHash = hashedRefreshToken;
        await user.save();


        user.password = undefined;

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: {
            accessToken,
            refreshToken,
            user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
        }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        const refreshTokenHash = hashRefreshToken(refreshToken);

        const user = await User.findOne({
            refreshTokenHash
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        const accessToken = generateAccessToken(user);

        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            data: {
                accessToken
            }
        });

    } catch (err) {
        console.error("Refresh token error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


const logout = async (req, res) => {
    try {

        const userId = req.user._id || req.user.id;

        await User.findByIdAndUpdate(
            userId,
            {
                refreshTokenHash: null
            }
        );

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (err) {
        console.error("Logout error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
module.exports = {
    register,
    login,
    refreshAccessToken,
    logout
};