const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true
    },
    description : {
        type : String,
        required : true,
        trim : true
    },
    price : {
        type : Number,
        required : true,
        min : 0
    },
    category : {
        type : String,
        required : true,
        trim : true
    },
    stock : {
        type : Number,
        required : true,
        min : 0 
    },
    imageUrl: {
        type: String,
        default: null
    },

    imagePublicId: {
        type: String,
        default: null
    }
},{
       timestamps : true    

});

module.exports = mongoose.model('Product', productSchema);
