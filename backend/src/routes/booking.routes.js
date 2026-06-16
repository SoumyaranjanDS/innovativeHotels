const express = require('express');
const { getMyBookings, getCabSuggestions, bookCab, getBookingById } = require('../controllers/booking.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.get('/my', getMyBookings);
router.get('/hotel-bookings/:id/cab-suggestions', getCabSuggestions);
router.post('/cab/book', bookCab);
router.get('/:id', getBookingById);

module.exports = router;
