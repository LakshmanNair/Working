const express = require('express');
const router = express.Router();
const controller = require('../controllers/transactionsController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requestTime } = require('../middleware/time');

// /transactions (purchase + adjustment + list)
router.post('/', requireAuth, requestTime, controller.createTransaction);

router.get('/', requireAuth, requireRole('manager'), controller.listTransactions);

// /transactions/:transactionId
router.get('/:transactionId', requireAuth, requireRole('manager'), controller.getTransaction);

// /transactions/:transactionId/suspicious
router.patch('/:transactionId/suspicious', requireAuth, requireRole('manager'), controller.toggleSuspicious);

// /transactions/:transactionId/processed
router.patch('/:transactionId/processed', requireAuth, requireRole('cashier'), controller.processRedemption);

module.exports = router;
