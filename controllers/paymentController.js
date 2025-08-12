const paymentService = require('../services/paymentService.js');
const paypalClient = require('../config/paypal');
const paypal = require('@paypal/checkout-server-sdk');
const TourBooking = require('../models/TourBooking');
const Tour = require('../models/Tour');
const transactionRepo = require('../repositories/transactionRepository');
const BASE_URL = process.env.PUBLIC_URL || 'http://localhost:9999';
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

/**
 * Tạo đơn PayPal cho Tour
 * Body: { bookingId, totalPrice }
 */
const createPayPalOrder = async (req, res) => {
  try {
    const { bookingId, totalPrice } = req.body;

    if (!bookingId || !totalPrice) {
      return res.status(400).json({ error: 'Thiếu bookingId hoặc totalPrice' });
    }

    const booking = await TourBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking không tồn tại' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking không ở trạng thái pending' });
    }
    if (booking.totalPrice !== totalPrice) {
      return res.status(400).json({ error: 'Số tiền không khớp với booking' });
    }

    // Chuyển sang USD
    let usdAmount = (Number(totalPrice) / 25000).toFixed(2);
    if (usdAmount < 1) {
      usdAmount = "1.00"; // PayPal yêu cầu >= 1 USD
    }

    // Tạo request PayPal
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE', // Cho phép thanh toán ngay
      purchase_units: [{
        reference_id: bookingId,
        amount: {
          currency_code: 'USD',
          value: usdAmount
        }
      }],
      application_context: {
        brand_name: "Your Brand Name",
        landing_page: "LOGIN",
        user_action: "PAY_NOW", // Quan trọng: Hiển thị nút Pay Now
        return_url: `${BASE_URL}/api/payment/success?bookingId=${bookingId}`,
        cancel_url: `${BASE_URL}/api/payment/cancel?bookingId=${bookingId}`
      }
    });

    const order = await paypalClient.execute(request);
    const approvalUrl = order.result.links.find(link => link.rel === 'approve')?.href;

    console.log("✅ PayPal Order Created:", order.result.id);
    return res.json({ approvalUrl, id: order.result.id });

  } catch (err) {
    console.error('❌ createPayPalOrder error:', err);
    return res.status(500).json({ error: 'Lỗi tạo đơn PayPal' });
  }
};


/**
 * Capture thanh toán PayPal cho Tour
 */
const capturePayPalPayment = async (req, res) => {
  try {
    const { token, bookingId: bookingIdQuery } = req.query;
    console.log("=== PAYPAL CALLBACK ===");
    console.log("Token:", token);
    console.log("BookingId (query):", bookingIdQuery);

    if (!token) {
      console.error("❌ Thiếu token (orderId) từ PayPal");
      return res.redirect(`${BASE_URL}/api/payment/payment-result?status=fail`);
    }

    // Capture order từ PayPal
    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});
    const capture = await paypalClient.execute(request);

    console.log("📦 Capture Response:", JSON.stringify(capture.result, null, 2));

    const pu = capture.result.purchase_units?.[0];
    const bookingId = pu?.reference_id || bookingIdQuery;
    const captureStatus = capture.result.status; // Lấy status từ root luôn
    const transactionId = pu?.payments?.captures?.[0]?.id;

    console.log("BookingId:", bookingId);
    console.log("CaptureStatus:", captureStatus);
    console.log("TransactionId:", transactionId);

    if (!bookingId) {
      console.error("❌ Không lấy được bookingId");
      return res.redirect(`${BASE_URL}/api/payment/payment-result?status=fail`);
    }

    if (captureStatus !== 'COMPLETED') {
      console.error(`⚠️ Thanh toán chưa COMPLETED (status: ${captureStatus})`);
      return res.redirect(`${BASE_URL}/api/payment/payment-result?status=fail`);
    }

    // Update DB
    const booking = await TourBooking.findById(bookingId);
    if (!booking) {
      console.error("❌ Không tìm thấy booking trong DB");
      return res.redirect(`${BASE_URL}/api/payment/payment-result?status=fail`);
    }

    const tour = await Tour.findById(booking.tourId).select('providerId');

    if (booking.payment?.status !== 'paid') {
      booking.status = 'confirmed';
      booking.payment = {
        ...(booking.payment || { method: 'paypal' }),
        status: 'paid',
        paymentDate: new Date()
      };
      await booking.save();

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
          businessUserId: tour?.providerId,
          commission: 0,
          completedAt: new Date()
        }
      });
    }

    console.log("✅ Thanh toán PayPal thành công");
    return res.redirect(`${BASE_URL}/api/payment/payment-result?status=success`);

  } catch (err) {
    console.error("❌ capturePayPalPayment error:", err);
    return res.redirect(`${BASE_URL}/api/payment/payment-result?status=fail`);
  }
};

/**
 * Trang kết quả thanh toán
 */
const paymentResultPage = (req, res) => {
  const status = req.query.status;
  res.send(`
    <html>
      <body>
        <h2>Thanh toán ${status === 'success' ? 'THÀNH CÔNG' : 'THẤT BẠI'}!</h2>
      </body>
    </html>
  `);
};

module.exports = {
  createPayPalOrder,
  capturePayPalPayment,
  paymentResultPage,
handlePayOSWebhook
};