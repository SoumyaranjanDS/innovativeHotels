const express = require('express');
const { getDashboardStats, approveProvider, markFeeCollected, assignCab, rejectProvider, getProviderDetails } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/dashboard', getDashboardStats);
router.post('/approve', approveProvider);
router.post('/reject', rejectProvider);
router.get('/details/:type/:id', getProviderDetails);
router.put('/fees/:feeId/collect', markFeeCollected);
router.post('/cab-bookings/:bookingId/assign', assignCab);

// New Routes
const { getAllUsers, getAllBookings, getAllPayments, getAllSettlements, getGroupedCabs, deleteVehicle } = require('../controllers/admin.controller');

router.get('/users', getAllUsers);
router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);
router.get('/settlements', getAllSettlements);
router.get('/cabs/grouped', getGroupedCabs);
router.delete('/cabs/:id', deleteVehicle);

// Support
const { getAllSupportTickets, replyToSupportTicket } = require('../controllers/admin.controller');
router.get('/support', getAllSupportTickets);
router.patch('/support/:id', replyToSupportTicket);

module.exports = router;
