const express = require('express');

const router = express.Router();

const {
    addressValidator,
    updateAddressValidator,
    addressIdValidator
} = require('../validators/address.validator');

const {
    createAddress,
    getUserAddresses,
    getAddressbyId,
    updateAddress,
    deleteAddress
} = require('../controllers/address.controller');

const { protect } = require('../middlewares/auth.middleware');

const { validate } = require('../middlewares/validation.middleware');

router.post(
    '/',
    protect,
    addressValidator,
    validate,
    createAddress
);

router.get(
    '/',
    protect,
    getUserAddresses
);

router.get(
    '/:id',
    protect,
    addressIdValidator,
    validate,
    getAddressbyId
);

router.put(
    '/:id',
    protect,
    updateAddressValidator,
    validate,
    updateAddress
);

router.delete(
    '/:id',
    protect,
    addressIdValidator,
    validate,
    deleteAddress
);

module.exports = router;