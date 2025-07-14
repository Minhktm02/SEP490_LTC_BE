const otpStore = new Map();

function saveOTP(key, otp, expiresInMinutes = 10) {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  otpStore.set(key, { otp, expiresAt });
}

function verifyOTP(key, otp) {
  const record = otpStore.get(key);
  if (!record) return { valid: false, reason: 'OTP không tồn tại hoặc đã được sử dụng' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, reason: 'OTP đã hết hạn' };
  }
  if (record.otp !== otp) return { valid: false, reason: 'OTP không đúng' };
  otpStore.delete(key); 
  return { valid: true };
}

module.exports = { saveOTP, verifyOTP };
