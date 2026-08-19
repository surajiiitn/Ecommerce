const  User  = require("../models/user.model");
const  Cart  = require("../models/cart.model");
const  Order  = require("../models/order.model");
const Product  = require("../models/product.model");

const createOrder = async (req, res) => {
  try {
    const {id} = req.user;
    const cart = await Cart.findOne({ user: id})
                                        .populate("items.product");

    if (!cart || cart.items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Cart is empty",
        });
    }

    let totalAmount = 0;

    for(const item of cart.items) {
        const product = item.product;

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (item.quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `Not enough stock for ${product.name}`,
            });
        }

        totalAmount += product.price * item.quantity;
    }

    const orderItems = cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
    }));

    const order = await Order.create({
        user: id,
        items: orderItems,
        totalAmount,
    });

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id,{
          $inc: {
            stock: -item.quantity,
          },
        },
      );
    }

    cart.items = [];

    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};

const getMyOrders = async (req,res) => {
    try {

        const {id} = req.user;
        const orders = await Order.find({user: id}).populate("products.product").sort({createdAt : -1});

        res.status(200).json({
            success : true,
            data : orders
        })


    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        })
    }
}

const getOrderbyId = async (req,res) => {
    const { id} = req.params;

    try {
        const {id} = req.user;
        const Order = await Order.find({
            _id : id,
            user : id
        }).populate("items.product");

        // Owner Ship checking 

        if(!Order){
            return res.status(404).json({
                success : false,
                message : 'Order not found'
            })
        }

        res.status(200).json({
            success : true,
            data : Order
        })
    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        })
    }
}

const cancelOrder = async (req,res) => {
    const {id} = req.params;

    try{
        const order = await Order.findOne({
            _id : id,
            user : req.user.id
        });

        if(!order){
            return res.status(404).json({
                success : false,
                message : 'Order not found'
            })
        }

        if(order.status === 'cancelled'){
            return res.status(400).json({
                success : false,
                message : 'Order is already cancelled'
            })
        }

        if(order.status === 'shipped' || order.status === 'delivered'){
            return res.status(400).json({
                success : false,
                message : 'Order cannot be cancelled'
            })
        }

        order.status = 'cancelled';

        await order.save();

        res.status(200).json({
            success : true,
            message : 'Order cancelled successfully',
            data : order
        })
    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        })
    }
}

const getAllOrders = async (req,res) => {
    try{
        const orders = await Order.find()
                            .populate("user").select("-password")
                            .populate("products.product")
                            .sort({createdAt : -1});

        res.status(200).json({
            success : true,
            data : orders
        })
    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        })
    }
}

const updateOrderStatus = async (req,res) => {
    const {id} = req.params;
    const {status} = req.body;

    try{
        const order = await Order.findById(id);

        if(!order){
            return res.status(404).json({
                success : false,
                message : 'Order not found'
            })
        }

        if(order.status === 'cancelled'){
            return res.status(400).json({
                success : false,
                message : 'Order is cancelled'
            })
        }

        order.status = status;

        await order.save();

        res.status(200).json({
            success : true,
            message : 'Order status updated successfully',
            data : order
        })
    }catch(err){
        res.status(500).json({
            success : false,
            message : err.message
        })
    }
}

module.exports = {
    createOrder,
    getMyOrders,
    getOrderbyId,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
};

