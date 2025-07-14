const Payment = require('../models/Payment.js');
const Booking = require('../models/Booking.js');
const Transaction = require('../models/Transaction.js');
const bookingRepository = require('../repositories/bookingRepository.js');
const crypto = require('crypto');
require('dotenv').config();

// Hàm xác minh chữ ký
const verifyWebhookSignature = (data, signature) => {
  const checksumKey = process.env.Checksum_Key;
  if (!checksumKey) {
    throw new Error('Checksum_Key không được cấu hình trong .env');
  }
  const sortedData = Object.keys(data).sort().reduce((acc, key) => {
    acc[key] = data[key];
    return acc;
  }, {});
  const dataStr = JSON.stringify(sortedData);
  const hmac = crypto.createHmac('sha256', checksumKey);
  hmac.update(dataStr);
  return hmac.digest('hex') === signature;
};

const paymentService = {
  async handlePayOSWebhook(data, signature) {
    if (!verifyWebhookSignature(data, signature)) {
      throw new Error('Chữ ký không hợp lệ.');
    }

    const { code, orderCode, status, transaction, desc } = data;
    const bookingId = desc.split('Thanh toán đặt phòng ')[1];

    if (code !== '00') {
      throw new Error(`Webhook lỗi: ${data.message}`);
    }

    if (status === 'PAID') {
      const booking = await Booking.findById(bookingId);
      if (!booking) throw new Error('Booking không tồn tại.');

      booking.status = 'confirmed';
      await booking.save();

      const payment = await Payment.findOne({ bookingId });
      if (!payment) throw new Error('Payment không tồn tại.');
      payment.status = 'completed';
      payment.paymentDate = new Date(transaction.transactionDateTime);
      await payment.save();

      const transactionDoc = new Transaction({
        bookingId,
        userId: booking.userId,
        type: 'payment',
        amount: booking.totalPrice,
        method: booking.paymentInfo.paymentMethod,
        status: 'completed',
        transactionId: transaction.id,
        paymentLinkId: booking.paymentLink,
        details: { completedAt: new Date(transaction.transactionDateTime) },
      });
      await transactionDoc.save();
    } else if (status === 'CANCELLED') {
      await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
      await Payment.findOneAndUpdate({ bookingId }, { status: 'cancelled' });
    }

    return { success: true };
  },
};

module.exports = paymentService;