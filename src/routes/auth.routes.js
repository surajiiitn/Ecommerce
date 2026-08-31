const express = require('express');
const router = express.Router();
const { login , register , refreshAccessToken, logout } = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const { validate } = require('../middlewares/validation.middleware');

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

module.exports = router;