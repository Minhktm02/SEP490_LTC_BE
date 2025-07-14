const WithdrawRequest = require('../models/WithdrawRequest');

class WithdrawRequestRepository {
  async create(withdrawRequestData, session) {
    return await WithdrawRequest.create([withdrawRequestData], { session });
  }

  async findById(withdrawRequestId, session) {
    return await WithdrawRequest.findById(withdrawRequestId).session(session);
  }
}

module.exports = new WithdrawRequestRepository();