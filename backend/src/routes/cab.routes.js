const express = require('express');
const router = express.Router();
const { getFareEstimate, createCabBooking } = require('../controllers/cabBooking.controller');
const { acceptRide, updateRideStatus, getRideRequests, getActiveRide, updateLocation, verifyOTP } = require('../controllers/cabDriver.controller');
const { protect, authorize } = require('../middlewares/auth');

// Customer Routes
router.post('/fare-estimate', protect, getFareEstimate);
router.post('/book', protect, createCabBooking);

// Driver Routes
router.get('/driver/profile', protect, authorize('Provider'), require('../controllers/cabDriver.controller').getDriverProfile);
router.get('/driver/ride-requests', protect, authorize('Provider'), getRideRequests);
router.get('/driver/rides/current', protect, authorize('Provider'), getActiveRide);
router.patch('/driver/location', protect, authorize('Provider'), updateLocation);
router.post('/driver/ride-requests/:bookingId/accept', protect, authorize('Provider'), acceptRide);
router.patch('/driver/rides/:bookingId/status', protect, authorize('Provider'), updateRideStatus);
router.post('/driver/rides/:bookingId/verify-otp', protect, authorize('Provider'), verifyOTP);

module.exports = router;
