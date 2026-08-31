const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role
    };
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
        }
    );
};


const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};


const hashRefreshToken = (refreshToken) => {
    return crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
};


module.exports = {
    generateAccessToken,
    generateRefreshToken,
    hashRefreshToken
};