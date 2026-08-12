const express = require('express');
const router = express.Router();
const { productValidator } = require('../validators/product.validator');

const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');

const { protect} = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', protect, authorize(['admin']), productValidator, createProduct);
router.put('/:id', protect,authorize(['admin']), productValidator, updateProduct);
router.delete('/:id', protect,authorize(['admin']), productValidator, deleteProduct);

module.exports = router;