const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Tour = require('../models/Tour');

const findTransactionsByBusinessUserId = async (businessUserId, filters = {}) => {
  const { startDate, endDate, status, type } = filters;
  const query = { 'details.businessUserId': businessUserId };
  if (status) query.status = status;
  if (type) query.type = type;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  return await Transaction.find(query)
    .select('bookingId amount type method status transactionId createdAt details')
    .populate('bookingId', 'totalPrice type hotelId tourId paymentInfo')
    .lean();
};
//
const findTourTransactionsByProviderId = async (providerId, filters = {}) => {
  const { startDate, endDate, status, type } = filters;
  const query = { 'details.businessUserId': providerId };
  if (status) query.status = status;
  if (type) query.type = type;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const transactions = await Transaction.find(query)
    .select('tourBookingId amount type method status transactionId createdAt details')
    .populate('tourBookingId', 'totalPrice tourId customerId status') // tour only
    .lean();

  return transactions.map(tx => ({
    ...tx,
    bookingType: 'tour'
  }));
};

const getBalanceByBusinessUserId = async (businessUserId) => {
  const balance = await Transaction.aggregate([
    { $match: { 'details.businessUserId': businessUserId, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return balance[0]?.total || 0;
};

const createPayoutRequest = async (businessUserId, amount, method) => {
  try {
    const user = await User.findOne({ _id: businessUserId, role: { $in: ['hotel_owner', 'tour_provider'] } });
    if (!user) {
      throw new Error('Người dùng không tồn tại hoặc không phải đối tác kinh doanh');
    }
    if (!user.businessInfo.bankDetails?.accountNumber && method === 'bank_transfer') {
      throw new Error('Thông tin ngân hàng chưa được cung cấp');
    }
    const balance = await getBalanceByBusinessUserId(businessUserId);
    if (amount > balance) {
      throw new Error('Số dư không đủ để rút');
    }
    const hotels = await Hotel.find({ ownerId: businessUserId }).select('additionalInfo.payoutPolicy');
    const payoutPolicy = hotels[0]?.additionalInfo?.payoutPolicy || 'monthly';
    const transaction = new Transaction({
      userId: businessUserId,
      type: 'payout',
      amount: -amount,
      method,
      status: 'pending',
      transactionId: `PO_${Date.now()}_${businessUserId}`,
      details: { businessUserId, commission: 0 }
    });
    await transaction.save();
    return { payoutId: transaction._id, amount, status: 'pending', createdAt: transaction.createdAt, payoutPolicy };
  } catch (error) {
    throw new Error(`Lỗi khi tạo yêu cầu rút tiền: ${error.message}`);
  }
};

const findPayoutsByBusinessUserId = async (businessUserId) => {
  return await Transaction.find({ 'details.businessUserId': businessUserId, type: 'payout' })
    .select('amount method status transactionId createdAt details.completedAt')
    .lean();
};

const updateBankDetails = async (businessUserId, bankDetails) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: businessUserId, role: { $in: ['hotel_owner', 'tour_provider'] } },
      { $set: { 'businessInfo.bankDetails': bankDetails } },
      { new: true, runValidators: true }
    ).select('businessInfo.bankDetails');
    if (!user) {
      throw new Error('Người dùng không tồn tại hoặc không phải đối tác kinh doanh');
    }
    return user.businessInfo.bankDetails;
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật thông tin ngân hàng: ${error.message}`);
  }
};

module.exports = {
  findTransactionsByBusinessUserId,
  findTourTransactionsByProviderId,
  getBalanceByBusinessUserId,
  createPayoutRequest,
  findPayoutsByBusinessUserId,
  updateBankDetails
};