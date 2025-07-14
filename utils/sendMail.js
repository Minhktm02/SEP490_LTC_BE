const nodemailer = require('nodemailer');
require('dotenv').config();
const crypto = require('crypto');

// Tạo transporter cho nodemailer
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return transporter;
  } catch (error) {
    throw new Error(`Không thể khởi tạo transporter: ${error.message}`);
  }
};

// Hàm gửi email
const sendMail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: '"Local Travel Connect System" <no-reply@localtravelconnect.com>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw new Error(`Gửi email thất bại: ${error.message}`);
  }
};

// Template HTML cho thông báo check-out
const createCheckoutNotificationEmailTemplate = (bookingId, checkOutDate, userId) => {
  const now = new Date('2025-06-13T16:26:00+07:00').toLocaleString('vi-VN', { timeZone: 'Asia/HoChiMinh' });
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #2e6c80; text-align: center;">✅ Check-out Hoàn Tất</h2>
      <h3 style="color: #333; text-align: center;">Local Travel Connect</h3>
      <hr style="border: 1px solid #eee;" />
      
      <p style="font-size: 16px; color: #333; text-align: center;">
        Xin chào [Tên Đối Tác]! 👋
      </p>
      <p style="font-size: 16px; color: #333; text-align: center;">
        Booking <strong>${bookingId}</strong> đã được hoàn tất check-out vào ${now}.
      </p>
      
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <h4 style="color: #333;">📋 Chi tiết:</h4>
        <ul style="font-size: 14px; color: #666; list-style-type: disc; padding-left: 20px;">
          <li>Khách: ${userId}</li>
          <li>Ngày check-out: ${checkOutDate}</li>
          <li>Trạng thái: Hoàn tất</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
        Vui lòng kiểm tra và xử lý thanh toán nếu cần.
      </p>

      <hr style="border: 1px solid #eee;" />
      <p style="font-size: 12px; color: #666; text-align: center;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>
      <div style="text-align: center; margin-top: 20px;">
        <p style="font-size: 14px; color: #666;">
          📧 support@localtravelconnect.com<br>
          📞 +84 123 456 789<br>
          🌐 localtravelconnect.com
        </p>
      </div>
    </div>
  `;
};

// Template HTML cho email xác thực tài khoản
const createAccountVerificationEmailTemplate = (otp, userName = 'Người dùng', expiryMinutes = 10) => {
  const now = new Date('2025-06-13T16:26:00+07:00').toLocaleString('vi-VN', { timeZone: 'Asia/HoChiMinh' });
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #2e6c80; text-align: center;">✅ Xác Thực Tài Khoản</h2>
      <h3 style="color: #333; text-align: center;">Local Travel Connect</h3>
      <hr style="border: 1px solid #eee;" />
      
      <p style="font-size: 16px; color: #333; text-align: center;">
        Xin chào ${userName}! 👋
      </p>
      <p style="font-size: 16px; color: #333; text-align: center;">
        Cảm ơn bạn đã đăng ký. Vui lòng sử dụng mã OTP dưới đây để xác thực email (gửi vào ${now}).
      </p>
      
      <div style="text-align: center; margin: 20px 0; background-color: #fff; padding: 15px; border-radius: 5px;">
        <h3 style="color: #2e6c80;">Mã OTP của bạn:</h3>
        <h1 style="font-size: 36px; color: #e74c3c; margin: 10px 0;">${otp}</h1>
        <p style="font-size: 14px; color: #666;">⏰ Hết hạn sau ${expiryMinutes} phút</p>
      </div>

      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px;">
        <h4 style="color: #333;">📋 Hướng dẫn:</h4>
        <ul style="font-size: 14px; color: #666; list-style-type: disc; padding-left: 20px;">
          <li>Nhập mã OTP trên trang xác thực</li>
          <li>Mã chỉ dùng một lần</li>
          <li>Không chia sẻ mã với người khác</li>
          <li>Nếu không đăng ký, hãy bỏ qua email này</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
        ⚠️ Bảo mật: Đây là email tự động. Nếu không yêu cầu, liên hệ hỗ trợ ngay!
      </p>

      <hr style="border: 1px solid #eee;" />
      <p style="font-size: 12px; color: #666; text-align: center;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>
      <div style="text-align: center; margin-top: 20px;">
        <p style="font-size: 14px; color: #666;">
          📧 support@localtravelconnect.com<br>
          📞 +84 123 456 789<br>
          🌐 localtravelconnect.com
        </p>
      </div>
    </div>
  `;
};

// Template HTML cho email quên mật khẩu
const createForgotPasswordEmailTemplate = (otp, userName = 'Người dùng', expiryMinutes = 10) => {
  const now = new Date('2025-06-13T16:26:00+07:00').toLocaleString('vi-VN', { timeZone: 'Asia/HoChiMinh' });
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #2e6c80; text-align: center;">🔑 Đặt Lại Mật Khẩu</h2>
      <h3 style="color: #333; text-align: center;">Local Travel Connect</h3>
      <hr style="border: 1px solid #eee;" />
      
      <p style="font-size: 16px; color: #333; text-align: center;">
        Xin chào ${userName}! 👋
      </p>
      <p style="font-size: 16px; color: #333; text-align: center;">
        Chúng tôi đã nhận yêu cầu đặt lại mật khẩu (gửi vào ${now}). Sử dụng mã OTP dưới đây.
      </p>
      
      <div style="text-align: center; margin: 20px 0; background-color: #fff; padding: 15px; border-radius: 5px;">
        <h3 style="color: #2e6c80;">Mã OTP của bạn:</h3>
        <h1 style="font-size: 36px; color: #e74c3c; margin: 10px 0;">${otp}</h1>
        <p style="font-size: 14px; color: #666;">⏰ Hết hạn sau ${expiryMinutes} phút</p>
      </div>

      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px;">
        <h4 style="color: #333;">📋 Hướng dẫn:</h4>
        <ul style="font-size: 14px; color: #666; list-style-type: disc; padding-left: 20px;">
          <li>Nhập mã OTP trên trang đặt lại mật khẩu</li>
          <li>Mã chỉ dùng một lần</li>
          <li>Không chia sẻ mã với người khác</li>
          <li>Nếu không yêu cầu, hãy bỏ qua email này</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
        ⚠️ Bảo mật: Đây là email tự động. Nếu không yêu cầu, liên hệ hỗ trợ ngay!
      </p>

      <hr style="border: 1px solid #eee;" />
      <p style="font-size: 12px; color: #666; text-align: center;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>
      <div style="text-align: center; margin-top: 20px;">
        <p style="font-size: 14px; color: #666;">
          📧 support@localtravelconnect.com<br>
          📞 +84 123 456 789<br>
          🌐 localtravelconnect.com
        </p>
      </div>
    </div>
  `;
};

// Hàm tạo OTP ngẫu nhiên
const generateOTP = (length = 6) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
};

// Hàm gửi email tùy chỉnh theo loại
const sendCustomEmail = async (to, type, ...args) => {
  let subject, template;
  switch (type) {
    case 'verify':
      subject = '✅ Mã OTP Xác Thực Tài Khoản - Local Travel Connect';
      template = createAccountVerificationEmailTemplate(...args);
      break;
    case 'forgot-password':
      subject = '🔑 Mã OTP Đặt Lại Mật Khẩu - Local Travel Connect';
      template = createForgotPasswordEmailTemplate(...args);
      break;
    case 'checkout':
      subject = '✅ Thông báo Check-out Hoàn Tất - Local Travel Connect';
      template = createCheckoutNotificationEmailTemplate(...args);
      break;
    default:
      throw new Error('Loại email không hợp lệ.');
  }
  return await sendMail(to, subject, template);
};

// Hàm gửi OTP hoặc thông báo
const sendNotificationEmail = async (to, userName = 'Người dùng', otpLength = 6, expiryMinutes = 10, type = 'verify') => {
  try {
    let otp = null;
    if (type === 'verify' || type === 'forgot-password') {
      otp = generateOTP(otpLength);
    }
    const args = type === 'checkout' ? [to, ...arguments[2]] : [otp, userName, expiryMinutes];
    const result = await sendCustomEmail(to, type, ...args);

    if (result.success && (type === 'verify' || type === 'forgot-password')) {
      console.log(`✅ OTP email sent successfully to ${to}`);
      console.log(`🔑 Generated OTP: ${otp} (expires in ${expiryMinutes} minutes)`);
      return { 
        success: true, 
        otp, 
        messageId: result.messageId,
        expiryTime: new Date(Date.now() + expiryMinutes * 60 * 1000)
      };
    } else if (result.success && type === 'checkout') {
      console.log(`✅ Checkout notification sent successfully to ${to}`);
      return { success: true, messageId: result.messageId };
    }
    throw new Error('Gửi email thất bại.');
  } catch (error) {
    console.error('❌ Error sending notification email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendNotificationEmail,
  generateOTP,
  createCheckoutNotificationEmailTemplate,
  createAccountVerificationEmailTemplate,
  createForgotPasswordEmailTemplate,
};