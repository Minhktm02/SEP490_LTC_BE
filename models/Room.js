const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema({
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  roomType: { type: String, required: true },
  price: { type: Number, required: true },
  availability: [{
    date: { type: Date, required: true },
    quantity: { type: Number, required: true }
  }],
  status: { type: String, enum: ['active', 'pending', 'inactive'], default: 'pending' },
  description: { type: String },
  amenities: [{ type: String }],
  images: [{ type: String }],
  maxPeople: { type: Number, default: 2 },
  area: { type: Number, default: 0 }, 
  createdAt: { type: Date, default: Date.now }
});

RoomSchema.index({ hotelId: 1 });

module.exports = mongoose.model('Room', RoomSchema);
