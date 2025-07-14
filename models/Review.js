const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Reviews Model: Lưu đánh giá của khách hàng về khách sạn/tour
const ReviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel' },
  tourId: { type: Schema.Types.ObjectId, ref: 'Tour' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  images: [{ type: String }],
  criteria: {
    cleanliness: { type: Number, min: 1, max: 5 },
    service: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 }
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for hotel and tour queries
ReviewSchema.index({ hotelId: 1 });
ReviewSchema.index({ tourId: 1 });

module.exports = mongoose.model('Review', ReviewSchema);