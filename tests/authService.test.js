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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if email and phone are missing', async () => {
    await expect(register({ password: 'pass', name: 'Test' }))
      .rejects.toMatchObject({ status: 400, message: /Phải có ít nhất email/ });
  });

  it('should throw if email already exists', async () => {
    findUserByEmail.mockResolvedValue({});
    await expect(register({ email: 'test@example.com', password: 'pass', name: 'Test' }))
      .rejects.toMatchObject({ status: 400, message: /Email đã được sử dụng/ });
  });

  it('should register a customer and send OTP', async () => {
    findUserByEmail.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashed');
    sendOTPEmail.mockResolvedValue({ success: true, otp: '123456' });

    const result = await register({
      email: 'test@example.com',
      password: 'pass',
      name: 'Test',
      role: 'customer',
    });

    expect(result).toHaveProperty('otp', '123456');
    expect(sendOTPEmail).toHaveBeenCalled();
  });

  it('should throw if sendOTPEmail fails', async () => {
    findUserByEmail.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashed');
    sendOTPEmail.mockResolvedValue({ success: false });

    await expect(register({
      email: 'fail@example.com',
      password: '123456',
      name: 'Fail',
    })).rejects.toMatchObject({ status: 500 });
  });

  it('should register without email (phone only)', async () => {
    const result = await register({
      phone: '0123456789',
      password: 'pass',
      name: 'NoEmail',
    });

    expect(result.message).toMatch(/thành công bằng số điện thoại/i);
  });
});


describe('verifyOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if user not found', async () => {
    findUserByEmail.mockResolvedValue(null);
    await expect(verifyOtp({ email: 'no@example.com', verificationCode: '000000' }))
      .rejects.toMatchObject({ status: 404 });
  });

  it('should throw if OTP invalid', async () => {
    findUserByEmail.mockResolvedValue({});
    verifyOTP.mockReturnValue({ valid: false, reason: 'OTP sai' });

    await expect(verifyOtp({ email: 'test@example.com', verificationCode: '123' }))
      .rejects.toMatchObject({ status: 400, message: 'OTP sai' });
  });

  it('should activate user if OTP valid', async () => {
    const user = { save: jest.fn(), status: 'pending', isEmailVerified: false };
    findUserByEmail.mockResolvedValue(user);
    verifyOTP.mockReturnValue({ valid: true });

    const res = await verifyOtp({ email: 'test@example.com', verificationCode: '123456' });

    expect(user.save).toHaveBeenCalled();
    expect(res.message).toMatch(/Xác minh OTP thành công/);
  });
});

describe('login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if email not found', async () => {
    findUserByEmail.mockResolvedValue(null);
    await expect(login('missing@example.com', 'pass'))
      .rejects.toMatchObject({ status: 404 });
  });

  it('should throw if user inactive', async () => {
    findUserByEmail.mockResolvedValue({ status: 'pending' });
    await expect(login('inactive@example.com', 'pass'))
      .rejects.toMatchObject({ status: 403 });
  });

  it('should throw if email not verified', async () => {
    findUserByEmail.mockResolvedValue({ status: 'active', isEmailVerified: false });
    await expect(login('noverify@example.com', 'pass'))
      .rejects.toMatchObject({ status: 403 });
  });

  it('should throw if password mismatch', async () => {
    findUserByEmail.mockResolvedValue({ status: 'active', isEmailVerified: true, password: 'hashed' });
    bcrypt.compare.mockResolvedValue(false);
    await expect(login('test@example.com', 'wrongpass'))
      .rejects.toMatchObject({ status: 401 });
  });

  it('should return token and user info if valid', async () => {
    const user = { _id: '123', role: 'customer', email: 'test@example.com', password: 'hashed', status: 'active', isEmailVerified: true, name: 'Test' };
    findUserByEmail.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token');

    const result = await login('test@example.com', 'pass');
    expect(result.accessToken).toBe('token');
    expect(result.user.email).toBe('test@example.com');
  });
});


describe('forgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if email not found', async () => {
    findUserByEmail.mockResolvedValue(null);
    await expect(forgotPassword('missing@example.com'))
      .rejects.toMatchObject({ status: 404 });
  });

  it('should throw if sendOTPEmail fails', async () => {
    findUserByEmail.mockResolvedValue({ name: 'User' });
    sendOTPEmail.mockResolvedValue({ success: false });

    await expect(forgotPassword('fail@example.com'))
      .rejects.toMatchObject({ status: 500 });
  });

  it('should return message and OTP info on success', async () => {
    findUserByEmail.mockResolvedValue({ name: 'User' });
    sendOTPEmail.mockResolvedValue({ success: true, otp: '999999', expiryTime: new Date(), messageId: 'abc' });

    const res = await forgotPassword('test@example.com');
    expect(res.otp).toBe('999999');
    expect(res.message).toMatch(/đã được gửi/);
  });
});


describe('resetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const now = new Date();

  it('should throw if email not found', async () => {
    findUserByEmail.mockResolvedValue(null);
    await expect(resetPassword('no@example.com', '123', 'newPass', now))
      .rejects.toMatchObject({ status: 404 });
  });

  it('should throw if OTP expired', async () => {
    findUserByEmail.mockResolvedValue({ _id: '123' });

    const expired = new Date(now.getTime() - 60000);
    await expect(resetPassword('test@example.com', '123', 'newPass', expired))
      .rejects.toMatchObject({ status: 400 });
  });

  it('should update password on valid OTP and not expired', async () => {
    findUserByEmail.mockResolvedValue({ _id: '123' });
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashed');

    const future = new Date(now.getTime() + 60000);
    const result = await resetPassword('test@example.com', '123', 'newPass', future);

    expect(updatePassword).toHaveBeenCalledWith('123', 'hashed');
    expect(result.message).toMatch(/thành công/);
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
