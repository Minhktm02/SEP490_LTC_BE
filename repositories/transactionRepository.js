const Transaction = require('../models/Transaction');

class TransactionRepository {
  async create(transactionData, session) {
    return await Transaction.create([transactionData], { session });
  }

  async updateOne(query, update, session) {
    return await Transaction.updateOne(query, update, { session });
  }
}

module.exports = new TransactionRepository();