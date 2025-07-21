jest.mock('nodemailer');
require('dotenv').config();

const nodemailer = require('nodemailer');
const {
  sendOTPEmail,
  generateOTP,
} = require('../services/emailService'); // update path if needed

const { 
  createAccountVerificationEmailTemplate, 
  createForgotPasswordEmailTemplate 
} = require('../services/emailService');

// --- MOCK setup
const sendMailMock = jest.fn();
const createTransportMock = { sendMail: sendMailMock };
nodemailer.createTransport.mockReturnValue(createTransportMock);

describe('📧 Email Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('generateOTP - should return string of specified length', () => {
    const otp = generateOTP(6);
    expect(otp).toHaveLength(6);
    expect(/^\d+$/.test(otp)).toBe(true);
  });

  test('sendMail - success', async () => {
    sendMailMock.mockResolvedValue({ messageId: 'abc123' });

    const res = await sendOTPEmail('test@example.com', 'Test User', 6, 5, 'verify');

    expect(sendMailMock).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.otp).toHaveLength(6);
    expect(res.messageId).toBe('abc123');
    expect(res.expiryTime instanceof Date).toBe(true);
  });

  test('sendMail - forgot-password email', async () => {
    sendMailMock.mockResolvedValue({ messageId: 'forgot123' });

    const res = await sendOTPEmail('test@example.com', 'Test User', 6, 5, 'forgot-password');

    expect(sendMailMock).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.messageId).toBe('forgot123');
  });

  test('sendMail - failure case', async () => {
    sendMailMock.mockRejectedValue(new Error('SMTP error'));

    const res = await sendOTPEmail('fail@example.com', 'Test User', 6, 5);

    expect(res.success).toBe(false);
    expect(res.error).toBe('SMTP error');
  });

  test('createAccountVerificationEmailTemplate renders correct OTP and name', () => {
    const html = createAccountVerificationEmailTemplate('123456', 'Minh Hiếu', 15);
    expect(html).toContain('123456');
    expect(html).toContain('Minh Hiếu');
    expect(html).toContain('15 phút');
  });

  test('createForgotPasswordEmailTemplate renders correct OTP and name', () => {
    const html = createForgotPasswordEmailTemplate('999999', 'Admin', 20);
    expect(html).toContain('999999');
    expect(html).toContain('Admin');
    expect(html).toContain('20 phút');
  });
});
