const express = require('express');
const router = express.Router();

const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');

const { protect} = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', protect, authorize(['admin']), createProduct);
router.put('/:id', protect,authorize(['admin']), updateProduct);
router.delete('/:id', protect,authorize(['admin']), deleteProduct);

module.exports = router;