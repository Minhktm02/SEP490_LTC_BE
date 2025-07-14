const paymentService = require('../services/paymentService.js');
const paypalClient = require('../config/paypal');
const paypal = require('@paypal/checkout-server-sdk');
const TourBooking = require('../models/TourBooking');
const handlePayOSWebhook = async (req, res) => {
  try {
    const { data, signature } = req.body;

    if (!data || !signature) {
      return res.status(400).json({ success: false, message: 'Thiếu dữ liệu hoặc chữ ký.' });
    }

    const result = await paymentService.handlePayOSWebhook(data, signature);
    return res.status(200).json({ success: true, message: 'Webhook xử lý thành công.' });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const createPayPalOrder = async (req, res) => {
  const { totalPrice, bookingId } = req.body;

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: (totalPrice / 25000).toFixed(2)  // đổi từ VND sang USD
      }
    }],
    application_context: {
      return_url: `http://localhost:9999/api/payments/payment-success?bookingId=${bookingId}`,
      cancel_url: `http://localhost:9999/api/payments/payment-cancel`
    }
  });

  try {
    const order = await paypalClient.execute(request);
    const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;
    res.json({ approvalUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tạo đơn PayPal' });
  }
};
const capturePayPalPayment = async (req, res) => {
  const { token, bookingId } = req.query;
  const request = new paypal.orders.OrdersCaptureRequest(token);

  try {
    const capture = await paypalClient.execute(request);
    const transactionId = capture.result.id;

    await TourBooking.findByIdAndUpdate(bookingId, {
      status: 'paid',
      paymentMethod: 'paypal',
      transactionId
    });

    res.redirect('/payment-result?status=success');
  } catch (err) {
    console.error(err);
    res.redirect('/payment-result?status=fail');
  }
};

module.exports = { handlePayOSWebhook, createPayPalOrder, capturePayPalPayment };