const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// SystemSettings Model: Lưu cấu hình hệ thống
const SystemSettingsSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);