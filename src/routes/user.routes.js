const express = require('express');
const router = express.Router();

const { getProfile, getAllUsers , getUserById , updateUser , deleteUser } = require('../controllers/user.controller');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');


router.get('/profile', protect ,getProfile);

router.get('/',protect , authorize(['admin']),getAllUsers);
router.get('/:id',protect ,authorize(['admin']),getUserById);

router.put('/:id',protect,authorize(['admin']),updateUser);
router.delete('/:id',protect,authorize(['admin']),deleteUser);

module.exports = router;
