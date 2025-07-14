const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Promotions Model: Lưu thông tin mã giảm giá/khuyến mãi
const PromotionSchema = new Schema({
  code: { type: String, required: true, unique: true },
  description: { type: String },
  discount: { type: Number, required: true },
  type: { type: String, enum: ['hotel', 'tour', 'combo'], required: true },
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel' },
  tourId: { type: Schema.Types.ObjectId, ref: 'Tour' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  maxUses: { type: Number, required: true },
  usedCount: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

PromotionSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Promotion', PromotionSchema);