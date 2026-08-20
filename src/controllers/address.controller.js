const Address = require('../models/address.model');

const createAddress = async (req, res) => {
    try {
        const {
            fullName,
            phone,
            addressLine,
            city,
            state,
            pincode,
            country
        } = req.body;

        const address = await Address.create({
            user: req.user._id,
            fullName,
            phone,
            addressLine,
            city,
            state,
            pincode,
            country
        });

        res.status(201).json({
            success: true,
            message: "Address created successfully",
            data: address
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


const getUserAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({
            user: req.user._id
        });

        if (addresses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No addresses found for this user"
            });
        }

        res.status(200).json({
            success: true,
            message: "Addresses retrieved successfully",
            data: addresses
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


const getAddressbyId = async (req, res) => {
    const { id } = req.params;

    try {
        const address = await Address.findOne({
            _id: id,
            user: req.user._id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Address retrieved successfully",
            data: address
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


const updateAddress = async (req, res) => {
    const { id } = req.params;

    try {
        const address = await Address.findOne({
            _id: id,
            user: req.user._id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const {
            fullName,
            phone,
            addressLine,
            city,
            state,
            pincode,
            country
        } = req.body;

        if (fullName !== undefined)
            address.fullName = fullName;

        if (phone !== undefined)
            address.phone = phone;

        if (addressLine !== undefined)
            address.addressLine = addressLine;

        if (city !== undefined)
            address.city = city;

        if (state !== undefined)
            address.state = state;

        if (pincode !== undefined)
            address.pincode = pincode;

        if (country !== undefined)
            address.country = country;

        await address.save();

        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            data: address
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


const deleteAddress = async (req, res) => {
    const { id } = req.params;

    try {
        const address = await Address.findOne({
            _id: id,
            user: req.user._id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        await Address.deleteOne({
            _id: id,
            user: req.user._id
        });

        res.status(200).json({
            success: true,
            message: "Address deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


module.exports = {
    createAddress,
    getUserAddresses,
    getAddressbyId,
    updateAddress,
    deleteAddress
};