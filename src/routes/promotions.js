const express = require('express');
const router = express.Router();
const controller = require('../controllers/promotionsController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requestTime } = require('../middleware/time');

// Routes
// -------------------------------------------------------------
// POST /promotions
// Description: Create a new promotion.
// Clearance: Manager or higher
// -------------------------------------------------------------
router.post('/', requireAuth, requestTime, controller.createPromotion);

// -------------------------------------------------------------
// GET /promotions
// Description: Retrieve a list of promotions
// Clearance: Regular or higher
// -------------------------------------------------------------
router.get('/', requireAuth, requestTime, controller.listPromotions);

// -------------------------------------------------------------
// GET /promotions/:promotionId
// Clearance: Regular or higher
// -------------------------------------------------------------
router.get('/:promotionId', requireAuth, requestTime, controller.getPromotion);

// -------------------------------------------------------------
// PATCH /promotions/:promotionId
// Clearance: Manager or higher
// -------------------------------------------------------------
router.patch('/:promotionId', requireAuth, requireRole('manager'), requestTime, controller.updatePromotion);

// -------------------------------------------------------------
// DELETE /promotions/:promotionId
// Clearance: Manager or higher
// -------------------------------------------------------------
router.delete('/:promotionId', requireAuth, requireRole('manager'), requestTime, controller.deletePromotion);

module.exports = router;
