const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Mock toàn bộ service và repository
jest.mock('../services/authService');
jest.mock('../repositories/authRepository');

const authService = require('../services/authService');
const { findUserByEmail } = require('../repositories/authRepository');
const authController = require('../controllers/authController');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

// Routes setup
app.post('/auth/register', authController.register);
app.post('/auth/verify-otp', authController.verifyOtp);
app.post('/auth/login', authController.login);
app.post('/auth/forgot-password', authController.forgotPassword);
app.post('/auth/reset-password', authController.resetPassword);
app.get('/auth/profile', (req, res, next) => {
  req.user = { _id: 'user123' }; // fake user
  next();
}, authController.getProfile);
app.put('/auth/profile', (req, res, next) => {
  req.user = { _id: 'user123' }; // fake user
  next();
}, authController.updateProfile);
app.post('/auth/logout', authController.logout);
app.post('/auth/refresh-token', authController.refreshToken);

// Env variables mock
process.env.REFRESH_TOKEN_SECRET = 'secret';
process.env.ACCESS_TOKEN_SECRET = 'accesssecret';
process.env.ACCESS_TOKEN_EXPIRES_IN = '600';
process.env.REFRESH_TOKEN_EXPIRES_IN = '3600';
process.env.NODE_ENV = 'test';

describe('Auth Controller', () => {
  afterEach(() => jest.clearAllMocks());

  test('register - success', async () => {
    authService.register.mockResolvedValue({
      message: 'Đăng ký thành công',
      userId: '123',
      otp: '456789',
      expiryTime: Date.now() + 300000
    });

    const res = await request(app).post('/auth/register').send({
      email: 'test@example.com',
      password: '123456',
      name: 'Test',
      role: 'user',
      phone: '0123456789'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('verifyOtp - success', async () => {
    authService.verifyOtp.mockResolvedValue({ message: 'Xác minh thành công' });

    const res = await request(app).post('/auth/verify-otp').send({
      email: 'test@example.com',
      verificationCode: '123456'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('login - success', async () => {
    const mockSetCookie = jest.fn((res) => res.cookie('refreshToken', 'xyz'));
    authService.login.mockResolvedValue({
      accessToken: 'access123',
      user: { id: 'user123', email: 'test@example.com' },
      setCookie: mockSetCookie
    });

    const res = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: '123456'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBe('access123');
  });

  test('forgotPassword - success', async () => {
    authService.forgotPassword.mockResolvedValue({
      message: 'OTP đã được gửi',
      messageId: 'msg123',
      otp: '999999',
      expiryTime: Date.now() + 300000
    });

    const res = await request(app).post('/auth/forgot-password').send({
      email: 'test@example.com'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('resetPassword - success', async () => {
    authService.resetPassword.mockResolvedValue({ message: 'Đổi mật khẩu thành công' });

    const res = await request(app).post('/auth/reset-password').send({
      email: 'test@example.com',
      resetCode: 'abc123',
      newPassword: 'newpass',
      otp: '123456',
      expiryTime: Date.now() + 300000
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('getProfile - success', async () => {
    authService.getProfile.mockResolvedValue({ name: 'Test User', email: 'test@example.com' });

    const res = await request(app).get('/auth/profile');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('test@example.com');
  });

  test('updateProfile - success', async () => {
    authService.updateProfile.mockResolvedValue({ name: 'Updated User' });

    const res = await request(app).put('/auth/profile').send({ name: 'Updated User' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('logout - clears cookie', async () => {
    const res = await request(app).post('/auth/logout');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Đăng xuất thành công');
  });

  test('refreshToken - success', async () => {
    const email = 'test@example.com';
    const token = jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET);
    findUserByEmail.mockResolvedValue({ _id: 'user123', email, role: 'user' });

    const res = await request(app)
      .post('/auth/refresh-token')
      .send({ refreshToken: token });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
  });

  test('refreshToken - missing token', async () => {
    const res = await request(app).post('/auth/refresh-token').send({});

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
