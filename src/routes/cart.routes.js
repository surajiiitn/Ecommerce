const express = require('express');
const router = express.Router();

const {
    addToCart,
    getCart,
    updateCart,
    removeFromCart,
    deleteCart
} = require('../controllers/cart.controller');

const { protect } = require('../middlewares/auth.middleware');
const { cartValidator, cartProductParamValidator } = require('../validators/cart.validator');
const { validate } = require('../middlewares/validation.middleware');

router.post('/add', protect, cartValidator, validate, addToCart);
router.get('/', protect, getCart);
router.put('/update', protect, cartValidator, validate, updateCart);
router.delete('/remove/:productId', protect, cartProductParamValidator, validate, removeFromCart);
router.delete('/clear', protect, deleteCart);

module.exports = router;
