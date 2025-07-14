const express = require('express');
const router = express.Router();
const { registerBusinessUser, updateBusinessProfile } = require('../controllers/businessUserController');
const { registerValidation } = require('../validations/authValidation');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const {
  getTransactions,
  getBalance,
  createPayout,
  getPayouts,
  updateBankDetails
} = require('../controllers/transactionController');
const upload = require('../utils/upload');

// Business User Routes
router.post('/register-business', upload.single('businessLicenseImage'), registerValidation, registerBusinessUser);
router.patch('/profile', authMiddleware, roleMiddleware(['hotel_owner', 'tour_provider']), upload.array('avatar', 1), updateBusinessProfile);

router.get('/transactions', authMiddleware, roleMiddleware(['hotel_owner', 'tour_provider']), getTransactions);
router.get('/balance', authMiddleware, roleMiddleware(['hotel_owner', 'tour_provider']), getBalance);
router.post('/payout', authMiddleware, roleMiddleware(['hotel_owner', 'tour_provider']), createPayout);
router.get('/payouts', authMiddleware, roleMiddleware(['hotel_owner', 'tour_provider']), getPayouts);
router.patch('/bank-details', authMiddleware, roleMiddleware(['hotel_owner', 'tour_provider']), updateBankDetails);

module.exports = router;