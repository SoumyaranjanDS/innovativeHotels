const express = require("express");
const {
  onboardHotelCab,
  getHotelCabs,
  getHotelCabBookings,
} = require("../controllers/hotel-cab.controller");
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('Provider'));

router.post('/onboard', onboardHotelCab);
router.get('/', getHotelCabs);
router.get('/bookings', getHotelCabBookings);
router.patch('/bookings/:id/assign', require('../controllers/hotel-cab.controller').assignCabBooking);
router.patch('/bookings/:id/verify-otp', require('../controllers/hotel-cab.controller').verifyCabOTP);
router.patch('/bookings/:id/status', require('../controllers/hotel-cab.controller').updateCabStatus);
router.delete('/:id', require('../controllers/hotel-cab.controller').deleteHotelCab);
router.put('/:id', require('../controllers/hotel-cab.controller').updateHotelCab);

module.exports = router;
