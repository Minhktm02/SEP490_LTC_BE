const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }
  next();
};

// Register validation rules (Updated to make role optional)
const registerValidation = [
  body('email')
  .optional()
  .isEmail()
  .withMessage('Email không hợp lệ')
  .normalizeEmail()
  .isLength({ max: 255 })
  .withMessage('Email quá dài'),

body('phone')
  .optional()
  .isMobilePhone('vi-VN')
  .withMessage('Số điện thoại không hợp lệ'),

body()
  .custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error('Phải nhập email hoặc số điện thoại');
    }
    return true;
  }),
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'),

  body('name')
  .optional()
    .notEmpty()
    .withMessage('Tên không được để trống')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên phải có từ 2-50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Tên chỉ được chứa chữ cái và khoảng trắng'),

  body('role')
    .optional() // Make role optional
    .isIn(['customer', 'hotel_owner', 'tour_provider'])
    .withMessage('Role không hợp lệ'),

  body('taxId') // Added for business users
    .optional()
    .trim()
    .isLength({ min: 10, max: 13 })
    .withMessage('Mã số thuế phải có từ 10-13 ký tự')
    .matches(/^[0-9\-]+$/)
    .withMessage('Mã số thuế chỉ được chứa số và dấu gạch ngang'),

  validate
];

// Login validation rules
const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email không được để trống')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email không hợp lệ'),

  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống'),

  validate
];

// Email verification validation rules
const verifyEmailValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email không được để trống')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email không hợp lệ'),

  body('verificationCode')
    .notEmpty()
    .withMessage('Mã xác thực không được để trống')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Mã xác thực phải là 6 chữ số'),

  validate
];

// Resend verification validation rules
const resendVerificationValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email không được để trống')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email không hợp lệ'),

  validate
];

// Change password validation rules
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại không được để trống'),

  body('newPassword')
    .notEmpty()
    .withMessage('Mật khẩu mới không được để trống')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'),

  validate
];

// Update profile validation rules
const updateProfileValidation = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Tên không được để trống')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên phải có từ 2-50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Tên chỉ được chứa chữ cái và khoảng trắng'),

  body('phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),

  body('profile.address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Địa chỉ quá dài'),

  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Ngày sinh không hợp lệ'),

  validate
];

// Forgot Password validation rules
const forgotPasswordValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email không được để trống')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email không hợp lệ'),
  validate
];

// Reset Password validation rules
const resetPasswordValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email không được để trống')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email không hợp lệ'),
  body('resetCode')
    .notEmpty()
    .withMessage('Mã đặt lại không được để trống')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Mã đặt lại phải là 6 chữ số'),
  body('newPassword')
    .notEmpty()
    .withMessage('Mật khẩu mới không được để trống')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'),
  validate
];

// Admin Verify Business User validation rules
const verifyBusinessValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID không được để trống')
    .isMongoId()
    .withMessage('User ID không hợp lệ'),
  body('approve')
    .notEmpty()
    .withMessage('Trạng thái phê duyệt không được để trống')
    .isBoolean()
    .withMessage('Trạng thái phê duyệt phải là true hoặc false'),
  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  changePasswordValidation,
  updateProfileValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyBusinessValidation
};