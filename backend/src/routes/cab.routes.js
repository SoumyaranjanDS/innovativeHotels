const express = require('express');
const router = express.Router();
const { getFareEstimate, createCabBooking } = require('../controllers/cabBooking.controller');
const { acceptRide, updateRideStatus } = require('../controllers/cabDriver.controller');
const { protect, authorize } = require('../middlewares/auth');

// Customer Routes
router.post('/fare-estimate', protect, getFareEstimate);
router.post('/book', protect, createCabBooking);

// Driver Routes
router.post('/driver/ride-requests/:bookingId/accept', protect, authorize('Provider'), acceptRide);
router.patch('/driver/rides/:bookingId/status', protect, authorize('Provider'), updateRideStatus);

module.exports = router;
