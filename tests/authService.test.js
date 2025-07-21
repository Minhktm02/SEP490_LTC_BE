jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../repositories/authRepository');
jest.mock('../services/otpMailService');
jest.mock('../config/cloudinary');
jest.mock('../models/User', () => function () {
  return {
    save: jest.fn().mockResolvedValue(),
  };
});
jest.mock('../models/LoyaltyPoints', () => function () {
  return {
    save: jest.fn().mockResolvedValue(),
  };
});
jest.mock('../utils/otpCache', () => ({
  saveOTP: jest.fn(),
  verifyOTP: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  findUserByEmail,
  updatePassword,
  findUserById,
  findLoyaltyPointsByUserId,
  updateUserProfile
} = require('../repositories/authRepository');
const { sendOTPEmail } = require('../services/otpMailService');
const { saveOTP, verifyOTP } = require('../utils/otpCache');

const {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile
} = require('../services/authService');

describe('register', () => {
  it('should register user with email and send OTP', async () => {
    findUserByEmail.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashedPassword');
    sendOTPEmail.mockResolvedValue({ success: true, otp: '123456' });

    const result = await register({
      email: 'test@example.com',
      password: 'password',
      name: 'Test User',
      role: 'customer',
      phone: '0123456789'
    });

    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('otp', '123456');
    expect(sendOTPEmail).toHaveBeenCalled();
    expect(saveOTP).toHaveBeenCalledWith('test@example.com', '123456', 10);
  });
});

describe('verifyOtp', () => {
  it('should verify OTP and activate user', async () => {
    const fakeUser = { save: jest.fn(), isEmailVerified: false };
    findUserByEmail.mockResolvedValue(fakeUser);
    verifyOTP.mockReturnValue({ valid: true });

    const result = await verifyOtp({
      email: 'test@example.com',
      verificationCode: '123456'
    });

    expect(result.message).toMatch(/Xác minh OTP thành công/i);
    expect(fakeUser.save).toHaveBeenCalled();
  });
});

describe('login', () => {
  it('should return access and refresh tokens if valid', async () => {
    const fakeUser = {
      _id: '123',
      role: 'customer',
      email: 'test@example.com',
      password: 'hashedPassword',
      status: 'active',
      isEmailVerified: true,
      name: 'Test User'
    };
    findUserByEmail.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token');

    const res = await login('test@example.com', 'password');
    expect(res.accessToken).toBe('token');
    expect(res.user).toHaveProperty('email', 'test@example.com');
  });
});

describe('forgotPassword', () => {
  it('should send reset OTP via email', async () => {
    findUserByEmail.mockResolvedValue({ name: 'Test User' });
    sendOTPEmail.mockResolvedValue({
      success: true, otp: '654321', messageId: 'msg123', expiryTime: new Date()
    });

    const res = await forgotPassword('test@example.com');
    expect(res.message).toMatch(/đã được gửi/i);
    expect(sendOTPEmail).toHaveBeenCalledWith('test@example.com', 'Test User', 6, 10, 'forgot-password');
  });
});

describe('resetPassword', () => {
  it('should update password if resetCode valid', async () => {
    findUserByEmail.mockResolvedValue({ _id: '123' });
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('newHashed');

    const now = new Date();
    const res = await resetPassword('test@example.com', '123456', 'newPassword', new Date(now.getTime() + 60000));

    expect(updatePassword).toHaveBeenCalledWith('123', 'newHashed');
    expect(res.message).toMatch(/Đặt lại mật khẩu thành công/i);
  });
});

describe('getProfile', () => {
  it('should return user profile and loyalty points', async () => {
    findUserById.mockResolvedValue({
      email: 'test@example.com',
      phone: '0123456789',
      name: 'Test User',
      profile: {
        address: '123 Street',
        dateOfBirth: '2000-01-01',
        avatar: 'url'
      },
      role: 'customer'
    });
    findLoyaltyPointsByUserId.mockResolvedValue({ points: 100, history: [] });

    const res = await getProfile('123');
    expect(res.name).toBe('Test User');
    expect(res.loyaltyPoints.points).toBe(100);
  });
});

describe('updateProfile', () => {
  it('should update profile fields and avatar', async () => {
    const mockFile = { buffer: Buffer.from('image') };
    const cloudinaryMockResult = { secure_url: 'https://cloud.com/avatar.jpg' };

    require('../config/cloudinary').uploader = {
      upload_stream: (opts, callback) => ({
        end: () => callback(null, cloudinaryMockResult)
      })
    };

    updateUserProfile.mockResolvedValue({
      email: 'test@example.com',
      phone: '0123',
      name: 'Updated User',
      profile: {
        address: 'New address',
        dateOfBirth: '2000-01-01',
        avatar: 'https://cloud.com/avatar.jpg'
      }
    });

    const result = await updateProfile('123', {
      name: 'Updated User',
      address: 'New address',
      dateOfBirth: '2000-01-01'
    }, [mockFile]);

    expect(result.name).toBe('Updated User');
    expect(result.avatar).toContain('https://cloud.com/avatar.jpg');
  });
});
