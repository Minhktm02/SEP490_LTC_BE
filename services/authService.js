const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { findUserByEmail, updatePassword, findUserById, findLoyaltyPointsByUserId, updateUserProfile } = require('../repositories/authRepository');
const { sendOTPEmail } = require('./otpMailService');
const cloudinary = require('../config/cloudinary');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const User = require('../models/User');
const { saveOTP, verifyOTP } = require('../utils/otpCache');

require('dotenv').config();

const register = async ({ email, password, name, role, phone }) => {
  if (!email && !phone) {
    throw { status: 400, message: 'Phải có ít nhất email hoặc số điện thoại' };
  }

  if (email) {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw { status: 400, message: 'Email đã được sử dụng' };
    }
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({
    email: email || undefined,
    phone: phone || undefined,
    password: hashedPassword,
    name,
    role: role || 'customer',
    status: 'pending',
    isEmailVerified: false,
    createdAt: new Date(),
    profile: {
      updatedAt: new Date(),
    },
  });
  await user.save();

  if (user.role === 'customer') {
    const loyaltyPoints = new LoyaltyPoints({
      userId: user._id,
      points: 0,
      history: [],
    });
    await loyaltyPoints.save();
  }

  if (email) {
    const expiryMinutes = 10;
    const { success, otp } = await sendOTPEmail(email, name, 6, expiryMinutes, 'verify');
    if (!success) {
      throw { status: 500, message: 'Không thể gửi OTP, vui lòng thử lại', error: 'Email sending failed' };
    }
    saveOTP(email, otp, expiryMinutes);

    return {
      userId: user._id,
      otp,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để nhận OTP xác thực.',
    };
  }

  return {
    userId: user._id,
    message: 'Đăng ký thành công bằng số điện thoại.',
  };
};

const verifyOtp = async ({ email, verificationCode }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw { status: 404, message: 'Người dùng không tồn tại' };
  }

  const { valid, reason } = verifyOTP(email, verificationCode);
  if (!valid) {
    throw { status: 400, message: reason };
  }

  user.status = 'active';
  user.isEmailVerified = true;
  await user.save();

  return { message: 'Xác minh OTP thành công! Tài khoản đã được kích hoạt.' };
};

const login = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw { status: 404, message: 'Email không tồn tại' };
  }

  if (user.status !== 'active') {
    throw { status: 403, message: 'Tài khoản chưa được kích hoạt' };
  }

  if (!user.isEmailVerified) {
    throw { status: 403, message: 'Email chưa được xác minh' };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { status: 401, message: 'Mật khẩu không đúng' };
  }

  const accessToken = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { id: user._id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );

  return {
    accessToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    setCookie: (res) => {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) * 1000,
      });
    },
  };
};

const forgotPassword = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw { status: 404, message: 'Email không tồn tại' };
  }

  const expiryMinutes = 10;
  const { success, otp, expiryTime, messageId } = await sendOTPEmail(email, user.name, 6, expiryMinutes, 'forgot-password');
  if (!success) {
    throw { status: 500, message: 'Không thể gửi mã đặt lại, vui lòng thử lại' };
  }

  return { message: 'Mã đặt lại mật khẩu đã được gửi qua email. Vui lòng kiểm tra hộp thư.', messageId, otp, expiryTime };
};

const resetPassword = async (email, resetCode, newPassword, expiryTime, otp) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw { status: 404, message: 'Email không tồn tại' };
  }

  if (new Date() > new Date(expiryTime)) {
    throw { status: 400, message: 'Mã đặt lại đã hết hạn' };
  }
  if (resetCode !== otp) {
    throw { status: 400, message: 'Mã đặt lại không đúng' };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await updatePassword(user._id, hashedPassword);
  return { message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.' };
};

const getProfile = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw { status: 404, message: 'Người dùng không tồn tại' };
  }

  const loyaltyPoints = await findLoyaltyPointsByUserId(userId);
  if (!loyaltyPoints && user.role === 'customer') {
    throw { status: 404, message: 'Điểm tích lũy không tồn tại' };
  }

  return {
    email: user.email,
    phone: user.phone,
    name: user.name,
    address: user.profile.address,
    dateOfBirth: user.profile.dateOfBirth,
    avatar: user.profile.avatar,
    loyaltyPoints: loyaltyPoints
      ? {
          points: loyaltyPoints.points,
          history: loyaltyPoints.history,
        }
      : null,
  };
};

const updateProfile = async (userId, updates, files) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw { status: 400, message: 'ID người dùng không hợp lệ' };
    }
    const profileUpdates = {};
    if (updates.name) profileUpdates.name = updates.name;
    if (updates.address) profileUpdates['profile.address'] = updates.address;
    if (updates.dateOfBirth) profileUpdates['profile.dateOfBirth'] = updates.dateOfBirth;

    if (files && files.length > 0) {
      const file = files[0];
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'SEP490/avatars',
              resource_type: 'image',
            },
            (error, result) => {
              if (error) {
                console.error('Lỗi tải lên Cloudinary:', error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          stream.end(file.buffer);
        });
        profileUpdates['profile.avatar'] = result.secure_url;
      } catch (error) {
        console.error('Chi tiết lỗi tải lên Cloudinary:', error);
        throw { status: 500, message: 'Lỗi khi tải ảnh lên Cloudinary' };
      }
    }
    profileUpdates['profile.updatedAt'] = new Date();

    const userExists = await User.findById(userId).lean();
    if (!userExists) {
      throw { status: 404, message: 'Người dùng không tồn tại trong cơ sở dữ liệu' };
    }

    const updatedUser = await updateUserProfile(userId, profileUpdates);
    if (!updatedUser) {
      throw { status: 404, message: 'Không thể cập nhật hồ sơ, người dùng không tồn tại' };
    }
    if (!updatedUser.email || !updatedUser.profile) {
      throw { status: 500, message: 'Dữ liệu người dùng không đầy đủ sau khi cập nhật' };
    }
    return {
      email: updatedUser.email,
      phone: updatedUser.phone,
      name: updatedUser.name,
      address: updatedUser.profile.address,
      dateOfBirth: updatedUser.profile.dateOfBirth,
      avatar: updatedUser.profile.avatar,
    };
  } catch (error) {
    console.error('Lỗi trong updateProfile:', error);
    throw error.status ? error : { status: 500, message: `Lỗi hệ thống khi cập nhật hồ sơ: ${error.message}` };
  }
};
module.exports = {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
};