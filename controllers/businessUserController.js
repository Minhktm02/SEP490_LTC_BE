const { registerBusinessUserService, updateBusinessProfileService } = require('../services/businessUserService');

const registerBusinessUser = async (req, res) => {
  try {
    const result = await registerBusinessUserService(req.body, req.file);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Business User Registration error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateBusinessProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await updateBusinessProfileService(userId, req.body, req.files);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Business Profile Update error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { registerBusinessUser, updateBusinessProfile };