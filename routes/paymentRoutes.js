const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');


router.post('/payos-webhook', paymentController.handlePayOSWebhook);

router.post('/create-paypal-order', paymentController.createPayPalOrder);
router.get('/success', paymentController.capturePayPalPayment);
router.get('/cancel', (req, res) =>
  res.redirect('/api/payment/payment-result?status=fail')
);

router.get('/payment-result', paymentController.paymentResultPage);
module.exports = router;
