const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Notifications Model: Lưu thông báo gửi đến người dùng
const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['booking_status', 'promotion', 'price_alert'], required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for user queries
NotificationSchema.index({ userId: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);