const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['hotel', 'tour'], required: true },

  hotelId: {
    type: Schema.Types.ObjectId,
    ref: 'Hotel',
    required: function () {
      return this.type === 'hotel';
    }
  },

  tourId: {
    type: Schema.Types.ObjectId,
    ref: 'Tour',
    required: function () {
      return this.type === 'tour';
    }
  },

  details: {
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    tourDate: { type: Date },
    numberOfPeople: { type: Number, required: true },
    roomType: { type: String },
    roomId: { type: String },
    specialRequests: { type: String }
  },

  totalPrice: { type: Number, required: true },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },

  paymentLink: { type: String },

  paymentInfo: {
    bookingCode: { type: String, unique: true, required: true },
    payoutStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['payos', 'momo', 'vnpay'], default: 'payos' }
  },

  commissionAmount: { type: Number, default: 0 },     // admin giữ
  netPayoutAmount: { type: Number, default: 0 }       // trả đối tác

}, { timestamps: true });

BookingSchema.index({ userId: 1 });
BookingSchema.index({ hotelId: 1 });
BookingSchema.index({ tourId: 1 });
BookingSchema.index({ 'details.checkInDate': 1 });
BookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
