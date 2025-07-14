const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TourSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  itinerary: [{
    day: { type: Number, required: true },
    description: { type: String, required: true },
    location: { type: String }
  }],
  duration: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  availability: [{
    date: { type: Date, required: true },
    slots: { type: Number, required: true }
  }],
  images: [{ type: String }],
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'pending', 'inactive'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  additionalInfo: {
    policies: {
      cancellation: { type: String },
      depositRequired: { type: Boolean, default: false }
    },
    contact: {
      phone: { type: String },
      email: { type: String }
    },
    payoutPolicy: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'monthly'
    }
  }
}, { timestamps: true });

// Indices
TourSchema.index({ providerId: 1 });
TourSchema.index({ type: 1 });

module.exports = mongoose.model('Tour', TourSchema);