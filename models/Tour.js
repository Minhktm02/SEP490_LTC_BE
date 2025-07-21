const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Thông tin khách sạn
const HotelSchema = new Schema({
  name: { type: String },
  address: { type: String },
  stars: { type: Number }, // số sao
  link: { type: String }   // link khách sạn nếu có
}, { _id: false });

// Thông tin phương tiện
const TransportSchema = new Schema({
  type: { type: String },              // ví dụ: 'Xe 29 chỗ', 'Limousine'
  brand: { type: String },             // thương hiệu: 'Hyundai', 'Ford'
  licensePlate: { type: String },      // biển số xe (nếu có)
  provider: { type: String }           // nhà xe cung cấp
}, { _id: false });

// Thông tin bữa ăn trong ngày
const MealSchema = new Schema({
  day: { type: Number, required: true },
  breakfast: { type: String },
  lunch: { type: String },
  dinner: { type: String }
}, { _id: false });

const AvailabilitySchema = new Schema({
  date: { type: Date, required: true },                     // ngày đi
  endDate: { type: Date },                                  // ngày về (optional cho half-day)
  time: { type: String },                                   // giờ khởi hành
  timeSlot: { type: String },                               // dùng cho half-day
  meetLocation: { type: String },                           // điểm tập trung
  slots: { type: Number, required: true },                  // slot người tối đa
  status: { type: String, enum: ['available', 'full', 'cancelled'], default: 'available' },
  guideId: { type: Schema.Types.ObjectId, ref: 'User' },     // Hướng dẫn viên (nếu có)
  isPrivate: { type: Boolean, default: false }              // Nếu đã được đặt riêng
});

const TourSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  itinerary: [{
    day: { type: Number, required: true },
    description: { type: String, required: true },
    location: { type: String }
  }],
  meals: [MealSchema],                   //  Bổ sung chi tiết bữa ăn
  hotels: [HotelSchema],                //  Danh sách khách sạn trong tour
  transport: TransportSchema,           //  Thông tin xe đưa đón
  duration: { type: String, required: true },               // VD: '3N2Đ' hoặc 'half-day'
  type: { type: String, enum: ['multi-day', 'half-day'], required: true },
  serviceType: {
    type: String,
    enum: ['guided_tour', 'transport_only', 'ticket', 'combo'],
    default: 'guided_tour'
  },
  hasGuide: { type: Boolean, default: true },               // có hướng dẫn viên hay không
  allowPrivateBooking: { type: Boolean, default: false },   // tour này có cho phép đặt riêng không
  price: { type: Number, required: true },                  // giá cơ bản
  priceAdult: { type: Number },                             // giá người lớn
  priceChild: { type: Number },                             // giá trẻ em
  availability: [AvailabilitySchema],
  images: [{ type: String }],
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'pending', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

TourSchema.index({ providerId: 1 });
TourSchema.index({ type: 1 });

module.exports = mongoose.model('Tour', TourSchema);
