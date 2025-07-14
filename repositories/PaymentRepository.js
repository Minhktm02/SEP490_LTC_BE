const Payment = require('../models/Payment');

const PaymentRepository = {
  create: async (paymentData, session) => 
    await Payment.create([paymentData], { session }),

  updateStatus: async (bookingId, status, session) => 
    await Payment.findOneAndUpdate(
      { bookingId },
      { status, paymentDate: status === 'completed' ? new Date() : null, $inc: { attempts: 1 } },
      { session, new: true }
    ),

  findOne: async (query, session) => 
    await Payment.findOne(query).session(session),
};

module.exports = PaymentRepository;