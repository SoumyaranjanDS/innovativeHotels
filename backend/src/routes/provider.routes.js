const express = require('express');
const { getProviderStatus, addHotelService, addCabService, getProviderHotel, addRoom, getRooms } = require('../controllers/provider.controller');
const { protect, authorize } = require('../middlewares/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('Provider'));

router.get('/status', getProviderStatus);
router.post('/hotel-service', addHotelService);
router.post('/cab-service', addCabService);

// Hotel and Room Management
router.get('/hotel', getProviderHotel);
router.post('/rooms', addRoom);
router.get('/rooms', getRooms);

module.exports = router;
