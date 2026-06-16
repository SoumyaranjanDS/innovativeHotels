const express = require('express');
const { getProviderStatus, setProviderType, addHotelService, addCabService, getProviderHotel, addRoom, getRooms, getProviderHotelBookings, updateHotelBookingStatus, getProviderReviews } = require('../controllers/provider.controller');
const { protect, authorize } = require('../middlewares/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('Provider'));

router.get('/status', getProviderStatus);
router.patch('/type', setProviderType);
router.get('/metrics', require('../controllers/provider.controller').getProviderMetrics);
router.post('/hotel-service', addHotelService);
router.post('/cab-service', addCabService);

// Hotel and Room Management
router.get('/hotel', getProviderHotel);
router.get('/hotel-bookings', getProviderHotelBookings);
router.patch('/hotel-bookings/:id/status', updateHotelBookingStatus);
router.post('/rooms', addRoom);
router.get('/rooms', getRooms);
router.delete('/rooms/:id', require('../controllers/provider.controller').deleteRoom);
router.put('/rooms/:id', require('../controllers/provider.controller').updateRoom);

// Reviews
router.get('/reviews', getProviderReviews);

module.exports = router;
