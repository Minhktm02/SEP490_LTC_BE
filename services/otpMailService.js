const nodemailer = require('nodemailer');
require('dotenv').config();

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Hàm gửi email chính
const sendMail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Local Travel Connect System" `,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

// Template HTML cho email xác thực tài khoản
const createAccountVerificationEmailTemplate = (otp, userName = 'Người dùng', expiryMinutes = 10) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2e6c80;">✅ Xác Thực Tài Khoản</h2>
      <h3 style="color: #333;">Local Travel Connect System</h3>
      <hr style="border: 1px solid #eee;" />
      
      <p style="font-size: 16px; color: #333;">
        Xin chào ${userName}! 👋
      </p>
      <p style="font-size: 16px; color: #333;">
        Cảm ơn bạn đã đăng ký tài khoản tại Local Travel Connect! Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP bên dưới để xác thực email của bạn.
      </p>
      
      <div style="text-align: center; margin: 20px 0;">
        <h3 style="color: #2e6c80;">Mã OTP của bạn là:</h3>
        <h1 style="font-size: 36px; color: #e74c3c;">${otp}</h1>
        <p style="font-size: 14px; color: #666;">⏰ Mã này sẽ hết hạn sau ${expiryMinutes} phút</p>
      </div>

      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
        <h4 style="color: #333;">📋 Hướng dẫn sử dụng:</h4>
        <ul style="font-size: 14px; color: #666;">
          <li>Nhập mã OTP này vào trang xác thực trên website</li>
          <li>Mã chỉ có thể sử dụng một lần duy nhất</li>
          <li>Không chia sẻ mã này với bất kỳ ai</li>
          <li>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        ⚠️ Lưu ý bảo mật: Đây là email tự động từ hệ thống. Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ với chúng tôi ngay lập tức để bảo vệ tài khoản của bạn.
      </p>

      <hr style="border: 1px solid #eee;" />
      <p style="font-size: 14px; color: #333;">
        Chào mừng bạn đến với Local Travel Connect!
      </p>
      <p style="font-size: 12px; color: #666;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>

      <div style="text-align: center; margin-top: 20px;">
        <h4 style="color: #333;">Liên hệ hỗ trợ:</h4>
        <p style="font-size: 14px; color: #666;">
          📧 Email: support@localtravelconnect.com<br>
          📞 Hotline: +84 123 456 789<br>
          🌐 Website: localtravelconnect.com
        </p>
      </div>
    </div>
  `;
};

// Template HTML cho email quên mật khẩu
const createForgotPasswordEmailTemplate = (otp, userName = 'Người dùng', expiryMinutes = 10) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2e6c80;">🔑 Đặt Lại Mật Khẩu</h2>
      <h3 style="color: #333;">Local Travel Connect System</h3>
      <hr style="border: 1px solid #eee;" />
      
      <p style="font-size: 16px; color: #333;">
        Xin chào ${userName}! 👋
      </p>
      <p style="font-size: 16px; color: #333;">
        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP bên dưới để tiến hành đặt lại mật khẩu.
      </p>
      
      <div style="text-align: center; margin: 20px 0;">
        <h3 style="color: #2e6c80;">Mã OTP của bạn là:</h3>
        <h1 style="font-size: 36px; color: #e74c3c;">${otp}</h1>
        <p style="font-size: 14px; color: #666;">⏰ Mã này sẽ hết hạn sau ${expiryMinutes} phút</p>
      </div>

      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
        <h4 style="color: #333;">📋 Hướng dẫn sử dụng:</h4>
        <ul style="font-size: 14px; color: #666;">
          <li>Nhập mã OTP này vào trang đặt lại mật khẩu</li>
          <li>Mã chỉ có thể sử dụng một lần duy nhất</li>
          <li>Không chia sẻ mã này với bất kỳ ai</li>
          <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        ⚠️ Lưu ý bảo mật: Đây là email tự động từ hệ thống. Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ với chúng tôi ngay lập tức để bảo vệ tài khoản của bạn.
      </p>

      <hr style="border: 1px solid #eee;" />
      <p style="font-size: 14px; color: #333;">
        Cảm ơn bạn đã sử dụng dịch vụ Local Travel Connect!
      </p>
      <p style="font-size: 12px; color: #666;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>

      <div style="text-align: center; margin-top: 20px;">
        <h4 style="color: #333;">Liên hệ hỗ trợ:</h4>
        <p style="font-size: 14px; color: #666;">
          📧 Email: support@localtravelconnect.com<br>
          📞 Hotline: +84 123 456 789<br>
          🌐 Website: localtravelconnect.com
        </p>
      </div>
    </div>
  `;
};

// Hàm tạo OTP ngẫu nhiên
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

// Hàm gửi OTP email
const sendOTPEmail = async (userEmail, userName = 'Người dùng', otpLength = 6, expiryMinutes = 10, type = 'verify') => {
  try {
    const otp = generateOTP(otpLength);
    // Chọn template dựa trên type
    const htmlTemplate = type === 'forgot-password' 
      ? createForgotPasswordEmailTemplate(otp, userName, expiryMinutes)
      : createAccountVerificationEmailTemplate(otp, userName, expiryMinutes);
    
    // Chọn tiêu đề email dựa trên type
    const subject = type === 'forgot-password'
      ? '🔑 Mã OTP Đặt Lại Mật Khẩu - Local Travel Connect'
      : '✅ Mã OTP Xác Thực Tài Khoản - Local Travel Connect';

    const result = await sendMail(userEmail, subject, htmlTemplate);
    
    if (result.success) {
      // console.log(`✅ OTP email sent successfully to ${userEmail}`);
      // console.log(`🔑 Generated OTP: ${otp} (expires in ${expiryMinutes} minutes)`);
      return { 
        success: true, 
        otp, 
        messageId: result.messageId,
        expiryTime: new Date(Date.now() + expiryMinutes * 60 * 1000)
      };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail, generateOTP };