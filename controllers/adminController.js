const {
  getPendingBusinessUsersService,
  verifyBusinessUserService,
  checkTaxCodeService
} = require('../services/adminService');



const getPendingBusinessUsers = async (req, res) => {
  try {
    const result = await getPendingBusinessUsersService();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching pending users:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
};

const verifyBusinessUser = async (req, res) => {
  try {
    const result = await verifyBusinessUserService(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Verification error:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
};

const checkTaxCode = async (req, res) => {
  try {
    const { taxCode } = req.query;
    if (!taxCode || !/^\d{10}(\d{3})?$/.test(taxCode)) {
      return res.status(400).json({ success: false, message: 'Mã số thuế không hợp lệ' });
    }
    console.log(`Checking tax code: ${taxCode}`);
    const result = await checkTaxCodeService(taxCode);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Tax code check error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
};

module.exports = { getPendingBusinessUsers, verifyBusinessUser, checkTaxCode };