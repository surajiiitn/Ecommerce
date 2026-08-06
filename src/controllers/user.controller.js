const User = require('../models/user.model');

const createUser = async (req,res) => {


    const { name , email ,password , role } = req.body;

    const newUser = new User({
        name,
        email,
        password,
        role
    });

    try{
        await newUser.save();
        res.status(201).json({ 
            message : 'User created successfully' ,
            user: newUser
        });
    }catch(err){
        res.status(500).json({ message: err.message });
    }

    
}

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
            message : 'User retrieved successfully',
            data : user
        })


    }catch(err){
        res.status(500).json({ message: err.message });
    }
}

const updateUser = async (req,res) => {
    const { id } = req.params; // get data from dynamic url 
    
    const { name , email , password , role } = req.body; // get data from request body

    try{
        const user = await User.findById(id);

        if(!user){
            returnres.status(404).json(
                {
                    success : false,
                    message : "User not found"
                }
            )
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.password = password || user.password;
        user.role = role || user.role;


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
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
}

