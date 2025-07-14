const authService = require('../services/authService');
const { findUserByEmail } = require('../repositories/authRepository');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const register = async (req, res) => {
  try {
    const { email, password, name, role, phone } = req.body;
    const result = await authService.register({ email, password, name, role, phone });
    return res.status(201).json({
      success: true,
      message: result.message,
      userId: result.userId,
      otp: result.otp,
      expiryTime: result.expiryTime,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi hệ thống',
      error: error.error || error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const result = await authService.verifyOtp({ email, verificationCode });
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi hệ thống',
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);

    data.setCookie(res);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        accessToken: data.accessToken,
        user: data.user,
      },
    });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi hệ thống',
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return res.status(200).json({
      success: true,
      message: result.message,
      messageId: result.messageId,
      otp: result.otp,
      expiryTime: result.expiryTime,
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi hệ thống',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword, expiryTime, otp } = req.body;
    const result = await authService.resetPassword(email, resetCode, newPassword, expiryTime, otp);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi hệ thống',
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await authService.getProfile(userId);

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin hồ sơ thành công',
      data: profile,
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi hệ thống',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body || {};
    const files = req.files || [];
    
    const updatedProfile = await authService.updateProfile(userId, updates, files);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công',
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi hệ thống',
    });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await findUserByEmail(decoded.email);
    if (!user) {
      return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    );

    const newRefreshToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    );

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
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
  logout,
  refreshToken,
};