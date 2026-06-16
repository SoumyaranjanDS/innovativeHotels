const express = require('express');
const {
  getMyHotelBookings,
  getHotelBookingDetail,
  cancelBookingRequest,
  modifyBookingRequest,
  addReview,
  createSupportTicket
} = require('../controllers/hotelBooking.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();
router.use(protect);

router.get('/my', getMyHotelBookings);
router.get('/:id', getHotelBookingDetail);
router.patch('/:id/cancel', cancelBookingRequest);
router.patch('/:id/modify', modifyBookingRequest);
router.post('/:id/review', addReview);
router.post('/:id/support', createSupportTicket);

module.exports = router;
