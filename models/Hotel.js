const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HotelSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  images: [{ type: String }],
  amenities: [{ type: String }],
  rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }, 
  status: { type: String, enum: ['active', 'pending', 'inactive'], default: 'pending' },
  additionalInfo: {
    policies: {
      cancellation: { type: String },
      checkInTime: { type: String },
      checkOutTime: { type: String },
      depositRequired: { type: Boolean, default: false }
    },
    category: {
      type: String,
      enum: ['hotel', 'resort', 'homestay', 'guest_house', '3_star', '4_star', '5_star']
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

HotelSchema.index({ location: '2dsphere' });
HotelSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Hotel', HotelSchema);
