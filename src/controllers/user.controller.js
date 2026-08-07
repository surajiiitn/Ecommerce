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
    const { id } = req.params; // get data from dynamic url 
    
    const { name , email , password  } = req.body; // get data from request body

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

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }


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

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getProfile
}
