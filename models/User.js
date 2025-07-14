const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String, sparse: true },
  password: { type: String, required: function() { return !this.googleId; } },
  role: {
    type: String,
    enum: ['customer', 'hotel_owner', 'tour_provider', 'admin'],
    default: 'customer',
    required: true
  },
  name: { type: String }, 
  profile: {
    avatar: { type: String },
    address: { type: String },
    dateOfBirth: { type: Date },
    updatedAt: { type: Date, default: Date.now }
  },
  googleId: { type: String, sparse: true },
  status: { type: String, enum: ['active', 'pending', 'banned'], default: 'pending' },
  isEmailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  businessInfo: {
    type: {
      type: String,
      enum: ['hotel_owner', 'tour_provider'],
      required: function() { return this.role === 'hotel_owner' || this.role === 'tour_provider'; }
    },
    taxId: { type: String, sparse: true },
    businessLicenseImage: { type: String, sparse: true },
    isVerified: {
      type: Boolean,
      default: false,
      required: function() { return this.role === 'hotel_owner' || this.role === 'tour_provider'; }
    },
    bankDetails: {
      accountNumber: { type: String }, 
      bankName: { type: String }, 
      branch: { type: String }
    },
    commissionRate: { type: Number, default: 0.10 },
    website: { type: String }, 
    transactionHistory: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }]
  }
}, { timestamps: true });

UserSchema.pre('save', function(next) {
  if (this.role === 'hotel_owner' || this.role === 'tour_provider') {
    if (!this.businessInfo.taxId && !this.businessInfo.businessLicenseImage) {
      return next(new Error('Phải cung cấp ít nhất mã số thuế hoặc hình ảnh giấy phép kinh doanh'));
    }
  }
  next();
});

// Indices
UserSchema.index({ role: 1 });
UserSchema.index({ 'businessInfo.type': 1 });

module.exports = mongoose.model('User', UserSchema);