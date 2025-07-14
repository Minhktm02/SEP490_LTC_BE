const Wallet = require('../models/Wallet');

class WalletRepository {
  async findByUserId(userId, session) {
    return await Wallet.findOne({ userId }).session(session);
  }

  async updateBalance(userId, amount, session) {
    return await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount }, updatedAt: new Date() },
      { session, upsert: true, new: true }
    );
  }

  async create(walletData, session) {
    return await Wallet.create([walletData], { session });
  }
}

module.exports = new WalletRepository();