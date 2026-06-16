const express = require('express');
const { getMySupportTickets, replyToSupportTicket } = require('../controllers/support.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();
router.use(protect);

router.get('/', getMySupportTickets);
router.patch('/:id/reply', replyToSupportTicket);

module.exports = router;
