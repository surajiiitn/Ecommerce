const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    fullName : {
        type : String,
        required : true,
        trim : true
    },
    phone : {
        type : String,
        required : true,
        trim : true
    },
    addressLine : {
        type : String,
        required : true,
        trim : true
    },
    city : {
        type : String,
        required : true,
        trim : true
    },
    state : {
        type : String,
        required : true,
        trim : true
    },
    pincode : {
        type : String,
        required : true,
        trim : true
    }, 
    country : {
        type : String,
        required : true,
        trim : true
    }
},{
    timestamps : true   

})

module.exports = mongoose.model("Address", addressSchema);