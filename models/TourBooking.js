const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TourBookingSchema = new Schema({
  tourId: { type: Schema.Types.ObjectId, ref: "Tour", required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  availabilityId: { type: Schema.Types.ObjectId, required: true },
  transactionId: { type: String },
  quantityAdult: { type: Number, required: true, min: 0 },
  quantityChild: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true },

  isPrivateBooking: { type: Boolean, default: false },

  payment: {
    method: {
      type: String,
      enum: ['paypal', 'momo', 'vnpay', 'cash'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    transactionId: { type: String }, // Mã giao dịch của cổng thanh toán (nếu có)
    paidAt: { type: Date }
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: "pending"
  },

  note: { type: String },
  bookedAt: { type: Date, default: Date.now }

}, { timestamps: true });

module.exports = mongoose.model("TourBooking", TourBookingSchema);
