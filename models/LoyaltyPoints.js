const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// LoyaltyPoints Model: Lưu điểm tích lũy của khách hàng
const LoyaltyPointsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, default: 0 },
  history: [{
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    pointsEarned: { type: Number, default: 0 },
    pointsUsed: { type: Number, default: 0 },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for user queries
LoyaltyPointsSchema.index({ userId: 1 });

module.exports = mongoose.model('LoyaltyPoints', LoyaltyPointsSchema);