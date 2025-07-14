const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WithdrawRequestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  note: { type: String },
  bankSnapshot: {
    accountNumber: String,
    bankName: String,
    branch: String,
    accountHolderName: String
  }

}, { timestamps: true });

WithdrawRequestSchema.index({ userId: 1 });
WithdrawRequestSchema.index({ status: 1 });

module.exports = mongoose.model('WithdrawRequest', WithdrawRequestSchema);
