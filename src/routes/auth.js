const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { requestTime } = require('../middleware/time');

// /auth/tokens - Authenticate user and generate JWT token.
router.post('/tokens', requestTime, controller.authenticate)

// /auth/resets/ - Requests password reset email/token.
router.post("/resets", requestTime, controller.getResetEmail)

// /auth/resets/:resetToken - Resets password of a user given reset token.
router.post("/resets/:resetToken", requestTime, controller.resetPassword)

module.exports = router;