const express = require('express');
const router = express.Router();

const { getProfile,getAllUsers , getUserById , updateUser , deleteUser } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');


router.get('/profile', protect ,getProfile);

router.get('/',getAllUsers);
router.get('/:id',getUserById);

router.put('/:id',protect,updateUser);
router.delete('/:id',protect,deleteUser);

module.exports = router;
