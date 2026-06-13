const express = require('express');
const { getDashboardStats, approveProvider, markFeeCollected } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/dashboard', getDashboardStats);
router.post('/approve', approveProvider);
router.put('/fees/:feeId/collect', markFeeCollected);

module.exports = router;
