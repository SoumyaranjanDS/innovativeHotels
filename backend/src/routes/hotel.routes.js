const express = require('express');
const { searchHotels, holdRoom, confirmBooking } = require('../controllers/hotel.controller');
const { protect } = require('../middlewares/auth');
const router = express.Router();

router.get('/search', searchHotels); // Public search

router.use(protect);

router.post('/hold', holdRoom);
router.post('/confirm', confirmBooking);

module.exports = router;
