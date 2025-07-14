const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Messages Model: Lưu tin nhắn hỗ trợ giữa khách hàng và nhà cung cấp/admin
const MessageSchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for sender and receiver queries
MessageSchema.index({ senderId: 1, receiverId: 1 });

module.exports = mongoose.model('Message', MessageSchema);