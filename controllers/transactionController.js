const {
  getTransactionsService,
  getBalanceService,
  createPayoutService,
  getPayoutsService,
  updateBankDetailsService
} = require('../services/transactionService');

const getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, status, type } = req.query;
    const filters = { startDate, endDate, status, type };
    const response = await getTransactionsService(req.user._id, filters);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Get transactions error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getBalance = async (req, res) => {
  try {
    const response = await getBalanceService(req.user._id);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Get balance error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const createPayout = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const response = await createPayoutService(req.user._id, amount, method);
    return res.status(201).json(response);
  } catch (error) {
    console.error('Create payout error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getPayouts = async (req, res) => {
  try {
    const response = await getPayoutsService(req.user._id);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Get payouts error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateBankDetails = async (req, res) => {
  try {
    const { accountNumber, bankName, branch } = req.body;
    const response = await updateBankDetailsService(req.user._id, { accountNumber, bankName, branch });
    return res.status(200).json(response);
  } catch (error) {
    console.error('Update bank details error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTransactions,
  getBalance,
  createPayout,
  getPayouts,
  updateBankDetails
};