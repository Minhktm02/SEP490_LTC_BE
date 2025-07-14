const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: function () { return ['payment', 'payout', 'refund'].includes(this.type); }
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['payment', 'payout', 'withdrawal', 'refund'], required: true },
  direction: { type: String, enum: ['in', 'out'], required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['momo', 'vnpay', 'paypal', 'bank_transfer', 'manual'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String, required: true },
  paymentLinkId: { type: String },
  details: {
    commission: { type: Number, default: 0 },
    businessUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date }
  }
}, { timestamps: true });

TransactionSchema.index({ bookingId: 1 });
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ direction: 1 });
TransactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);