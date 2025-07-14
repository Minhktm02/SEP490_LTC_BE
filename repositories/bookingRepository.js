const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const Room = require('../models/Room');
const Payment = require('../models/Payment');

const BookingRepository = {
  createBooking: async (bookingData, session) => 
    await Booking.create([bookingData], { session }),

  findById: async (bookingId, session) => 
    await Booking.findById(bookingId).session(session),

  updateStatus: async (bookingId, status, session) => 
    await Booking.findByIdAndUpdate(
      bookingId,
      { $set: { status, updatedAt: new Date() } },
      { session, new: true }
    ).lean(),

  getDetails: async (bookingId, ownerId, session) => 
    await Booking.findById(bookingId)
      .populate('hotelId', 'ownerId name')
      .populate('userId', 'name email')
      .session(session)
      .lean(),

  getPendingBookings: async (ownerId, filters = {}, page = 1, limit = 10) => {
    const { hotelId } = filters;
    const hotelQuery = { ownerId };
    if (hotelId) hotelQuery._id = hotelId;
    const hotels = await Hotel.find(hotelQuery).select('_id name').lean();
const hotelIds = (hotels || []).map(hotel => hotel._id);
if (!Array.isArray(hotelIds) || hotelIds.length === 0) {
  return { bookings: [], total: 0, page, limit };
}

    if (!hotelIds.length) return { bookings: [], total: 0, page, limit };

    const query = { type: 'hotel', status: 'pending', hotelId: { $in: hotelIds } };
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('hotelId', 'name')
        .populate('userId', 'name email')
        .select('hotelId userId details status totalPrice paymentInfo')
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query),
    ]);

    return {
      bookings: bookings.map(booking => ({
        _id: booking._id.toString(),
        bookingCode: booking.paymentInfo?.bookingCode || '',
        status: booking.status || 'pending',
        checkInDate: booking.details.checkInDate ? booking.details.checkInDate.toISOString().split('T')[0] : null,
        checkOutDate: booking.details.checkOutDate ? booking.details.checkOutDate.toISOString().split('T')[0] : null,
        roomType: booking.details.roomType || '',
        numberOfPeople: booking.details.numberOfPeople || 0,
        totalPrice: booking.totalPrice || 0,
        customer: { name: booking.userId?.name || 'Khách ẩn danh', email: booking.userId?.email || '' },
        hotel: { name: booking.hotelId?.name || '' },
      })),
      total,
      page,
      limit,
    };
  },

  getBookingsByOwnerHotels: async (ownerId, filters = {}, page = 1, limit = 10) => {
    const { status, hotelId, fromDate, toDate } = filters;
    const hotelQuery = { ownerId };
    if (hotelId) hotelQuery._id = hotelId;
    const hotels = await Hotel.find(hotelQuery).select('_id name').lean();
    const hotelIds = hotels.map(hotel => hotel._id);

    if (!hotelIds.length) return { bookings: [], total: 0, page, limit };

    const query = { type: 'hotel', hotelId: { $in: hotelIds } };
    if (status) query.status = status;
    if (fromDate) query['details.checkInDate'] = { $gte: new Date(fromDate) };
    if (toDate) query['details.checkOutDate'] = { $lte: new Date(toDate) };

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('hotelId', 'name')
        .populate('userId', 'name email')
        .select('hotelId userId details status totalPrice paymentInfo')
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query),
    ]);

    return {
      bookings: bookings.map(booking => ({
        _id: booking._id.toString(),
        bookingCode: booking.paymentInfo?.bookingCode || '',
        status: booking.status || 'pending',
        checkInDate: booking.details.checkInDate ? booking.details.checkInDate.toISOString().split('T')[0] : null,
        checkOutDate: booking.details.checkOutDate ? booking.details.checkOutDate.toISOString().split('T')[0] : null,
        roomType: booking.details.roomType || '',
        numberOfPeople: booking.details.numberOfPeople || 0,
        totalPrice: booking.totalPrice || 0,
        customer: { name: booking.userId?.name || 'Khách ẩn danh', email: booking.userId?.email || '' },
        hotel: { name: booking.hotelId?.name || '' },
      })),
      total,
      page,
      limit,
    };
  },

  getBookingDetails: async (bookingId, ownerId) => {
    const booking = await Booking.findById(bookingId)
      .populate('hotelId', 'name address ownerId')
      .populate('userId', 'name email phone')
      .select('hotelId userId details status totalPrice paymentInfo commissionAmount netPayoutAmount')
      .lean();

    if (!booking) throw new Error('Đơn đặt phòng không tồn tại');
    if (booking.type !== 'hotel' || !booking.hotelId || booking.hotelId.ownerId.toString() !== ownerId.toString()) {
      throw new Error('Bạn không có quyền xem đơn đặt phòng này');
    }

    return {
      _id: booking._id.toString(),
      bookingCode: booking.paymentInfo?.bookingCode || '',
      status: booking.status || 'pending',
      details: {
        checkInDate: booking.details.checkInDate ? booking.details.checkInDate.toISOString().split('T')[0] : null,
        checkOutDate: booking.details.checkOutDate ? booking.details.checkOutDate.toISOString().split('T')[0] : null,
        roomType: booking.details.roomType || '',
        specialRequests: booking.details.specialRequests || '',
      },
      customer: { name: booking.userId?.name || 'Khách ẩn danh', email: booking.userId?.email || '', phone: booking.userId?.phone || '' },
      hotel: { name: booking.hotelId?.name || '', address: booking.hotelId?.address || '' },
      paymentInfo: { paymentMethod: booking.paymentInfo?.paymentMethod || 'payos', payoutStatus: booking.paymentInfo?.payoutStatus || 'pending' },
      totalPrice: booking.totalPrice || 0,
      commissionAmount: booking.commissionAmount || 0,
      netPayoutAmount: booking.netPayoutAmount || 0,
    };
  },

  updateBookingStatus: async (bookingId, ownerId, status) => {
    const booking = await Booking.findById(bookingId).populate('hotelId', 'ownerId').lean();
    if (!booking) throw new Error('Đơn đặt phòng không tồn tại');
    if (booking.type !== 'hotel' || !booking.hotelId || booking.hotelId.ownerId.toString() !== ownerId.toString()) {
      throw new Error('Bạn không có quyền cập nhật đơn đặt phòng này');
    }

    const validTransitions = { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled'], completed: [], cancelled: [], refunded: [] };
    if (!validTransitions[booking.status].includes(status)) throw new Error(`Không thể chuyển từ trạng thái ${booking.status} sang ${status}`);

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    ).lean();

    return { _id: updatedBooking._id.toString(), status: updatedBooking.status, updatedAt: updatedBooking.updatedAt.toISOString() };
  },

  applyPromotion: async (promotionCode, hotelId, session) => {
    const promotion = await Promotion.findOne({
      code: promotionCode,
      type: 'hotel',
      hotelId,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      usedCount: { $lt: mongoose.Types.Long.fromString('maxUses') }
    }).session(session);

    if (!promotion) throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');

    await Promotion.findByIdAndUpdate(
      promotion._id,
      { $inc: { usedCount: 1 } },
      { session }
    );

    return promotion.discount;
  },

  createPayment: async (paymentData, session) => 
    await Payment.create([paymentData], { session }),

  updateRoomAvailability: async (roomId, checkInDate, checkOutDate, numberOfPeople, session) => {
    return await Room.updateOne(
      {
        _id: roomId,
        'availability.date': { $gte: new Date(checkInDate), $lte: new Date(checkOutDate) }
      },
      { $inc: { 'availability.$.quantity': -numberOfPeople } },
      { session }
    );
  }
};

module.exports = BookingRepository;