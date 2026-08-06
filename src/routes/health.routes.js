const express = require('express');
const router = express.Router();
const { health , sayHello} = require('../controllers/health.controller');

router.get('/', health);  
router.get('/sayHello', sayHello);

module.exports = router;
