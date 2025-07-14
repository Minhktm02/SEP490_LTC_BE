const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Payments Model: Lưu thông tin giao dịch thanh toán
const PaymentSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['momo', 'vnpay','paypal'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for booking and user queries
PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ userId: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);