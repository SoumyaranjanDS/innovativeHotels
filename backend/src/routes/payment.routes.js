const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { createIntent } = require('../controllers/payment.controller');

router.post('/create-intent', protect, createIntent);

module.exports = router;
