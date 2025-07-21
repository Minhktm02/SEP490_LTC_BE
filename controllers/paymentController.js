const paymentService = require('../services/paymentService.js');
const paypalClient = require('../config/paypal');
const paypal = require('@paypal/checkout-server-sdk');
const TourBooking = require('../models/TourBooking');
const Tour = require('../models/Tour');
const transactionRepo = require('../repositories/transactionRepository');

// Handle PayOS webhook (Hotel)
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

// Tạo đơn PayPal (Tour)
const createPayPalOrder = async (req, res) => {
  const { totalPrice, bookingId } = req.body;

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: (totalPrice / 25000).toFixed(2)
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

// Capture thanh toán PayPal (Tour)
const capturePayPalPayment = async (req, res) => {
  const { token, bookingId } = req.query;
  const request = new paypal.orders.OrdersCaptureRequest(token);

  try {
    const capture = await paypalClient.execute(request);
    const transactionId = capture.result.id;

    // Lấy booking và tour đầy đủ
    const booking = await TourBooking.findById(bookingId);
    if (!booking) throw new Error('Không tìm thấy booking');

    const tour = await Tour.findById(booking.tourId).select('providerId');
    if (!tour) throw new Error('Không tìm thấy tour');

    // Cập nhật trạng thái thanh toán
    booking.status = 'confirmed';
    booking.payment.status = 'completed';
    booking.payment.paymentDate = new Date();
    await booking.save();

    // Tạo Transaction
    await transactionRepo.create({
      userId: booking.customerId,
      type: 'payment',
      direction: 'in',
      amount: booking.totalPrice,
      method: 'paypal',
      status: 'completed',
      transactionId,
      tourBookingId: booking._id,
      details: {
        businessUserId: tour.providerId,
        commission: 0,
        completedAt: new Date()
      }
    });

    res.redirect('/payment-result?status=success');
  } catch (err) {
    console.error('PayPal capture error:', err.message);
    res.redirect('/payment-result?status=fail');
  }
};


module.exports = {
  handlePayOSWebhook,
  createPayPalOrder,
  capturePayPalPayment
};
