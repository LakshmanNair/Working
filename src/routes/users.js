const express = require('express');
const router = express.Router();
const controller = require('../controllers/usersController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requestTime } = require('../middleware/time');

// /users - Register new user.
// Requires cashier or higher.
router.post('/', requireAuth, requireRole('Cashier'), requestTime, controller.register)

// /users - Retrieve a list of users that may be filtered by the payload.
// Requires manager or higher.
router.get('/', requireAuth, requireRole('Manager'), controller.retrieve_list)

// /users/me - Updates current logged-in user's information.    
router.patch('/me', requireAuth, controller.update_self)

// /users/me - Retrieves current logged-in user's information.
router.get('/me', requireAuth, controller.retrieve_self)

// /users/me/password - Updates current logged-in user's password
router.patch('/me/password', requireAuth, controller.update_password)

// /users/:userId - Retrieves a specific user,
// If cashier, returns basic information. Else if Manager or higher, 
// returns indepth user information.
router.get('/:userId', requireAuth, requireRole('Cashier'), controller.retrieve)

// /users/:userId - Updates specific user's various statuses and some properties
// Requires manager or higher.
router.patch('/:userId', 
    requireAuth, requireRole('Manager'), controller.update_user)

// /users/me - Updates current logged-in user's information.    
router.patch('/me', requireAuth, controller.update_self)

// /users/me - Retrieves current logged-in user's information.
router.get('/me', requireAuth, controller.retrieve_self)

// /users/me/password - Updates current logged-in user's password
router.patch('/me/password', requireAuth, controller.update_password)

router.post('/me/transactions', requireAuth, controller.createRedemption);
router.get('/me/transactions', requireAuth, controller.listMyTransactions);

// Transfer points route
const transactionsController = require('../controllers/transactionsController');
router.post('/:userId/transactions', requireAuth, requestTime, transactionsController.transferPoints);

module.exports = router;