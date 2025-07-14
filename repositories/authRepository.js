const User = require('../models/User');
const LoyaltyPoints = require('../models/LoyaltyPoints');

const findUserById = async (userId) => {
  return await User.findById(userId).select('email phone name profile role status isEmailVerified businessInfo');
};

const findLoyaltyPointsByUserId = async (userId) => {
  return await LoyaltyPoints.findOne({ userId }).select('points history');
};

const updateUserProfile = async (userId, updates) => {
  try {
    return await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('email phone name profile businessInfo');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

const findUserByEmail = async (email) => {
  return await User.findOne({ email: email.toLowerCase() });
};

const findPendingBusinessUsers = async () => {
  return await User.find({
    role: { $in: ['hotel_owner', 'tour_provider'] },
    status: 'pending',
    'businessInfo.isVerified': false
  }).select('email name role businessInfo.taxId businessInfo.businessLicenseImage businessInfo.website createdAt').lean();
};

const createUser = async (userData) => {
  try {
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

const updateUser = async (user) => {
  try {
    return await User.findByIdAndUpdate(user._id, user, { new: true });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

const updatePassword = async (userId, hashedPassword) => {
  try {
    return await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

module.exports = {
  findUserById,
  findLoyaltyPointsByUserId,
  updateUserProfile,
  findUserByEmail,
  findPendingBusinessUsers,
  createUser,
  updateUser,
  updatePassword
};