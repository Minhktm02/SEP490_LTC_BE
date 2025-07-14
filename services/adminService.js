const UserRepository = require('../repositories/authRepository');
const axios = require('axios');

const getPendingBusinessUsersService = async () => {
  const users = await UserRepository.findPendingBusinessUsers();
  return { success: true, data: users };
};

const verifyBusinessUserService = async (data) => {
  const { userId, approve } = data;

  const user = await UserRepository.findUserById(userId);
  if (!user || !['hotel_owner', 'tour_provider'].includes(user.role)) {
    throw new Error('Người dùng không tồn tại hoặc không phải tài khoản kinh doanh');
  }

  if (approve) {
    user.businessInfo.isVerified = true;
    user.status = 'active'; 
  } else {
    user.status = 'banned';
  }

  user.updatedAt = new Date(); 
  await UserRepository.updateUser(user);
  return { success: true, message: approve ? 'Tài khoản đã được kích hoạt' : 'Tài khoản đã bị từ chối' };
};

const checkTaxCodeService = async (taxCode) => {
  try {
    if (!taxCode || !/^\d{10}(\d{3})?$/.test(taxCode)) {
      throw new Error('Mã số thuế không hợp lệ');
    }
    const url = `https://api.vietqr.io/v2/business/${taxCode}`;
    console.log(`Gọi API: ${url}`);
    const response = await axios.get(url);
    console.log('Phản hồi API:', response.data);
    if (response.status === 200 && response.data?.code === '00') {
      return { success: true, data: response.data.data };
    } else {
      console.log('Phản hồi API không hợp lệ:', response.data);
      return { success: false, message: `Mã số thuế không hợp lệ hoặc không tìm thấy: ${response.data?.desc || 'Không có thông tin lỗi'}` };
    }
  } catch (error) {
    console.error('Lỗi API:', error.response?.data, error.message, error.config?.url);
    return { success: false, message: `Lỗi khi kiểm tra mã số thuế: ${error.message}` };
  }
};

module.exports = { getPendingBusinessUsersService, verifyBusinessUserService, checkTaxCodeService };