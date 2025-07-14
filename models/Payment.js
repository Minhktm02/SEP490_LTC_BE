const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  status: { type: String, enum: ['pending', 'completed', 'cancelled', 'failed'], default: 'pending' },
  paymentDate: { type: Date },
  attempts: { type: Number, default: 0 }, 
});

module.exports = mongoose.model('Payment', paymentSchema);