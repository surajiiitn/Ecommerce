const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

const getProfile =  (req, res) => { 
    res.status(200).json({ 
        success: true, 
        data: req.user 
    });
};

const getAllUsers = async (req,res) => {
    try {
        const users = await User.find();

        res.status(200).json({
            success : true,
            message : 'Users retrieved successfully',
            data : users 
        })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

const getUserById = async (req,res) => {
    const { id } = req.params;
    try{
        const user = await User.findById(id);

        if(!user){
            return res.status(404).json(
                {
                    success : false,
                    message : 'User not found'
                }
            )
        }

        res.status(200).json({
            success : true,
            message : 'User retrieved successfully',
            data : user
        })


    }catch(err){
        res.status(500).json({ 
            success : false,
            message: err.message 
        });
    }
}

const updateUser = async (req,res) => {
    const { id }  = req.params; // get data from dynamic url 

    if(req.user.id !== id && req.user.role !== 'admin'){
        return res.status(403).json({
            success : false,
            message : "You are not authorized to update this user"
        })
    }
    
    const { name , email } = req.body; // get data from request body

    try{
        const user = await User.findById(id);

        if(!user){
            return res.status(404).json(
                {
                    success : false,
                    message : "User not found"
                }
            )
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;




        await user.save();

        res.status(200).json({
            success : true,
            message : "User updated successfully",
            data : user
        })

    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message,
        })
    }
}

const deleteUser = async (req,res) => {
    const {id} = req.params;

    if(req.user.id !== id && req.user.role !== 'admin'){
        return res.status(403).json({
            success : false,
            message : "You are not authorized to delete this user"
        })
    }

    try{
        const user = await User.findByIdAndDelete(id);

        if(!user){
            return res.status(404).json(
                {
                    success : false,
                    message : "User not found"
                }
            )
        }

        res.status(200).json({
            success : true,
            message : "User deleted successfully"
        })

    }catch(err){
        res.status(500).json({
            success :false,
            message : err.message 
        })
    }
}

const updatePassword = async (req,res) => {
    const { id } = req.params;

    if(req.user.id !== id){
        return res.status(403).json({
            success : false,
            message : "You are not authorized to update this user's password"
        })
    }

    const { oldPassword , newPassword} = req.body;

    try{
        const user = await User.findById(id);

        if(!user){
            return res.status(404).json(
                {
                    success : false,
                    message : "User not found"
                }
            )
        }

        const isMatch = await bcrypt.compare(oldPassword , user.password);

        if(!isMatch){
            return res.status(400).json({
                success : false,
                message : "Old password is incorrect"
            })
        }

        const hashedpassword = await bcrypt.hash(newPassword , 10);

        user.password = hashedpassword;
        
        await user.save();

        res.status(200).json({
            success : true,
            message : "Password updated successfully"
        })
    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        })
    }
    
}

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getProfile,
    updatePassword
}
