const express = require('express');
const router = express.Router();
const { productValidator } = require('../validators/product.validator');

const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');

const { protect} = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');
const { validate } = require('../middlewares/validation.middleware');

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', protect, authorize(['admin']), productValidator, validate, createProduct);
router.put('/:id', protect,authorize(['admin']), productValidator, validate, updateProduct);
router.delete('/:id', protect,authorize(['admin']), deleteProduct);

module.exports = router;
