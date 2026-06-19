const express = require('express');
const { searchHotels, getHotelDetail, checkAvailability, holdRoom, confirmBooking, cancelHold } = require('../controllers/hotel.controller');
const { protect } = require('../middlewares/auth');
const router = express.Router();

// Public routes
router.get('/search', searchHotels);
router.get('/:id', getHotelDetail);
router.post('/:id/check-availability', checkAvailability);

// Protected routes
router.use(protect);
router.post('/hold', holdRoom);
router.post('/cancel-hold', cancelHold);
router.post('/confirm', confirmBooking);

module.exports = router;
