const express = require('express');
const router = express.Router();
const { handlePayOSWebhook } = require('../controllers/paymentController.js');

router.post('/payos-webhook', handlePayOSWebhook);

module.exports = router;