const express = require('express');
const router = express.Router();
const { getPendingBusinessUsers, verifyBusinessUser, checkTaxCode } = require('../controllers/adminController');
const { verifyBusinessValidation } = require('../validations/authValidation');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Admin Routes
router.get('/business-users', authMiddleware, roleMiddleware(['admin']), getPendingBusinessUsers);
router.post('/verify-business', authMiddleware, roleMiddleware(['admin']), verifyBusinessValidation, verifyBusinessUser);
router.get('/check-tax-code', authMiddleware, roleMiddleware(['admin']), checkTaxCode);

module.exports = router;