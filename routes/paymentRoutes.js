const express = require('express');
const router = express.Router();
const { handlePayOSWebhook } = require('../controllers/paymentController');
const paymentController = require('../controllers/paymentController');


router.post('/payos-webhook', handlePayOSWebhook);


router.post('/create-paypal-order', paymentController.createPayPalOrder);
router.get('/payment-success', paymentController.capturePayPalPayment);
router.get('/payment-cancel', (req, res) => res.send('Đã huỷ thanh toán!'));
router.get('/payment-result', (req, res) => {
    const status = req.query.status;
    res.send(`
        <html>
            <body>
                <h2>Thanh toán ${status === 'success' ? 'THÀNH CÔNG' : 'THẤT BẠI'}!</h2>
            </body>
        </html>
    `);
});
module.exports = router;
