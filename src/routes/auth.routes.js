const express = require('express');
const router = express.Router();
const { login , register } = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const { validate } = require('../middlewares/validation.middleware');

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);

module.exports = router;