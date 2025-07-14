const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
  type: { 
    type: String, 
    enum: ['hotel_bookings', 'tour_bookings', 'revenue', 'system', 'payout', 'cancellations', 'room_type'],
    required: true 
  },
  statistics: {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel' },
    tourId: { type: Schema.Types.ObjectId, ref: 'Tour' },
    period: { type: String, required: true },
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    cancellations: { type: Number, default: 0 }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indices
ReportSchema.index({ createdBy: 1 });
ReportSchema.index({ 'statistics.hotelId': 1 });
ReportSchema.index({ 'statistics.tourId': 1 });

module.exports = mongoose.model('Report', ReportSchema);