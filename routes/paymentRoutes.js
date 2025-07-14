const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { handlePayOSWebhook } = require('../controllers/paymentController.js');

router.post('/create-paypal-order', paymentController.handlePayOSWebhook);
router.get('/payment-success', paymentController.capturePayPalPayment);
router.get('/payment-cancel', (req, res) => res.send('Đã huỷ thanh toán'));
router.post('/payos-webhook', handlePayOSWebhook);

module.exports = router;
