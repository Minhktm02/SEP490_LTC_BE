const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/authRepository');
const cloudinary = require('../config/cloudinary');

const registerBusinessUserService = async (data, file) => {
  const { email, password, role, taxId } = data;

  // Kiểm tra các trường bắt buộc
  if (!email || !password || !role) {
    throw new Error('Email, mật khẩu và vai trò là bắt buộc');
  }

  // Kiểm tra vai trò hợp lệ
  if (!['hotel_owner', 'tour_provider'].includes(role)) {
    throw new Error('Vai trò không hợp lệ, phải là hotel_owner hoặc tour_provider');
  }

  // Kiểm tra email đã tồn tại
  const existingUser = await UserRepository.findUserByEmail(email.toLowerCase());
  if (existingUser) {
    throw new Error('Email đã được sử dụng');
  }

  // Kiểm tra mã số thuế hoặc giấy phép kinh doanh
  if (!taxId && !file) {
    throw new Error('Phải cung cấp mã số thuế hoặc hình ảnh giấy phép kinh doanh');
  }

  // Xử lý upload giấy phép kinh doanh nếu có
  let businessLicenseImage = '';
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'business_licenses', resource_type: 'image' },
          (error, result) => {
            if (error) reject(new Error('Lỗi khi tải lên hình ảnh giấy phép kinh doanh'));
            resolve(result);
          }
        ).end(file.buffer);
      });
      businessLicenseImage = result.secure_url;
    } catch (error) {
      throw new Error(`Lỗi khi tải lên hình ảnh: ${error.message}`);
    }
  }

  // Mã hóa mật khẩu
  const hashedPassword = await bcrypt.hash(password, 10);

  // Tạo dữ liệu người dùng
  const userData = {
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    businessInfo: {
      type: role,
      taxId: taxId || undefined,
      businessLicenseImage: businessLicenseImage || undefined,
      isVerified: false,
      commissionRate: 0.1,
    },
    status: 'pending',
    isEmailVerified: true,
    createdAt: new Date(),
    profile: {
      updatedAt: new Date(),
    },
  };
  await UserRepository.createUser(userData);
  return { success: true, message: 'Đăng ký thành công, vui lòng chờ admin xét duyệt' };
};


const updateBusinessProfileService = async (userId, data, files) => {
  const { name, phone, bankDetails, website, address, dateOfBirth } = data;

  const user = await UserRepository.findUserById(userId);
  if (!user || !['hotel_owner', 'tour_provider'].includes(user.role)) {
    throw new Error('Người dùng không tồn tại hoặc không phải tài khoản kinh doanh');
  }

  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (address) updates['profile.address'] = address;
  if (dateOfBirth) updates['profile.dateOfBirth'] = dateOfBirth;
  if (website) updates['businessInfo.website'] = website;
  if (bankDetails) {
    updates['businessInfo.bankDetails'] = {
      accountNumber: bankDetails.accountNumber || '',
      bankName: bankDetails.bankName || '',
      branch: bankDetails.branch || '',
    };
  }

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
            if (error) reject(new Error('Lỗi khi tải lên ảnh đại diện'));
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });
      updates['profile.avatar'] = result.secure_url;
    } catch (error) {
      throw new Error(`Lỗi khi tải lên ảnh: ${error.message}`);
    }
  }

  updates['profile.updatedAt'] = new Date();
  const updatedUser = await UserRepository.updateUserProfile(userId, updates);
  if (!updatedUser) {
    throw new Error('Không thể cập nhật hồ sơ');
  }

  return {
    success: true,
    message: 'Cập nhật hồ sơ thành công',
    data: {
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      role: updatedUser.role,
      profile: updatedUser.profile,
      businessInfo: {
        website: updatedUser.businessInfo.website,
        bankDetails: updatedUser.businessInfo.bankDetails,
      },
    },
  };
};

module.exports = { registerBusinessUserService, updateBusinessProfileService };