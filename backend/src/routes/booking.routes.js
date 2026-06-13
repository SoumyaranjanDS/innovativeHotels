const express = require('express');
const { getMyBookings } = require('../controllers/booking.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.get('/my', getMyBookings);

module.exports = router;
