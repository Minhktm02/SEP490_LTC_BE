const TransactionRepository = require('../repositories/transactionRepository');

const getTransactionsService = async (businessUserId, filters) => {
  const transactions = await TransactionRepository.findTransactionsByBusinessUserId(businessUserId, filters);
  return { success: true, message: 'Lấy lịch sử giao dịch thành công', data: transactions };
};

const getBalanceService = async (businessUserId) => {
  const balance = await TransactionRepository.getBalanceByBusinessUserId(businessUserId);
  return { success: true, message: 'Lấy số dư ví thành công', data: { balance } };
};

const createPayoutService = async (businessUserId, amount, method) => {
  if (amount <= 0) {
    throw new Error('Số tiền rút phải lớn hơn 0');
  }
  if (!['momo', 'vnpay', 'paypal', 'bank_transfer'].includes(method)) {
    throw new Error('Phương thức thanh toán không hợp lệ');
  }
  const payout = await TransactionRepository.createPayoutRequest(businessUserId, amount, method);
  return { success: true, message: `Yêu cầu rút tiền đã được tạo, sẽ xử lý theo chính sách ${payout.payoutPolicy}`, data: payout };
};

const getPayoutsService = async (businessUserId) => {
  const payouts = await TransactionRepository.findPayoutsByBusinessUserId(businessUserId);
  return { success: true, message: 'Lấy danh sách yêu cầu rút tiền thành công', data: payouts };
};

const updateBankDetailsService = async (businessUserId, bankDetails) => {
  const { accountNumber, bankName, branch } = bankDetails;
  if (!accountNumber || !bankName || !branch) {
    throw new Error('Thông tin ngân hàng không đầy đủ');
  }
  const updatedBankDetails = await TransactionRepository.updateBankDetails(businessUserId, { accountNumber, bankName, branch });
  return { success: true, message: 'Cập nhật thông tin ngân hàng thành công', data: updatedBankDetails };
};

module.exports = {
  getTransactionsService,
  getBalanceService,
  createPayoutService,
  getPayoutsService,
  updateBankDetailsService
};