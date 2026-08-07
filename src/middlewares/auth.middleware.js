const jwt = require('jsonwebtoken');
const user = require('../models/user.model');

const protect = async (req,res,next) => {
    
    try {
        let authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({
                success : false,
                message : "Not authorized to access this route"
            });
        }

        let token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token , process.env.JWT_SECRET);

        const User = await user.findById(decoded.id).select('-password');

        if(!User){
            return res.status(404).json({
                success : false,
                message : "User not found"
            }); 
        }

        req.user = User;
        next();
    }catch(err){

        if(err.name === 'JsonWebTokenError'){
            return res.status(401).json({
                success : false,
                message : "Not authorized to access this route"
            });
        }

        if(err.name === 'TokenExpiredError'){
            return res.status(401).json({
                success : false,
                message : "Token expired"
            });
        }
        
        res.status(500).json({
            success : false,
            message : err.message
        });
    }
}


module.exports = {
    protect
}