const express = require('express');
const router = express.Router();
const controller = require('../controllers/analyticsController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requestTime } = require('../middleware/time');

// GET /analytics/summary
// Returns aggregated statistics
// Clearance: Manager or higher
router.get('/summary', requireAuth, requireRole('manager'), requestTime, controller.getSummary);

// GET /analytics/transactions-per-day
// Returns daily transaction statistics
// Query params: days (default: 30)
// Clearance: Manager or higher
router.get('/transactions-per-day', requireAuth, requireRole('manager'), requestTime, controller.getTransactionsPerDay);

// GET /analytics/promotion-usage
// Returns promotion usage statistics
// Clearance: Manager or higher
router.get('/promotion-usage', requireAuth, requireRole('manager'), requestTime, controller.getPromotionUsage);

module.exports = router;

