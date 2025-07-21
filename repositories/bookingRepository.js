const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const User = require('../models/User');

const getPendingBookings = async (ownerId, filters = {}, page = 1, limit = 10) => {
  try {
    const { hotelId } = filters;
    const hotelQuery = { ownerId };
    if (hotelId) {
      hotelQuery._id = hotelId;
    }
    const hotels = await Hotel.find(hotelQuery).select('_id name').lean();
    const hotelIds = hotels.map(hotel => hotel._id);

    if (!hotelIds.length) {
      return { bookings: [], total: 0, page, limit };
    }

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
      Booking.countDocuments(query)
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
        customer: {
          name: booking.userId?.name || 'Khách ẩn danh',
          email: booking.userId?.email || ''
        },
        hotel: {
          name: booking.hotelId?.name || ''
        }
      })),
      total,
      page,
      limit
    };
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách đặt phòng cần xác nhận: ${error.message}`);
  }
};

const getBookingsByOwnerHotels = async (ownerId, filters = {}, page = 1, limit = 10) => {
  try {
    const { status, hotelId, fromDate, toDate } = filters;
    const hotelQuery = { ownerId };
    if (hotelId) {
      hotelQuery._id = hotelId;
    }
    const hotels = await Hotel.find(hotelQuery).select('_id name').lean();
    const hotelIds = hotels.map(hotel => hotel._id);

    if (!hotelIds.length) {
      return { bookings: [], total: 0, page, limit };
    }

    const query = { type: 'hotel', hotelId: { $in: hotelIds } };
    if (status) {
      query.status = status;
    }
    if (fromDate) {
      query['details.checkInDate'] = { $gte: new Date(fromDate) };
    }
    if (toDate) {
      query['details.checkOutDate'] = { $lte: new Date(toDate) };
    }

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('hotelId', 'name')
        .populate('userId', 'name email')
        .select('hotelId userId details status totalPrice paymentInfo')
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query)
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
        customer: {
          name: booking.userId?.name || 'Khách ẩn danh',
          email: booking.userId?.email || ''
        },
        hotel: {
          name: booking.hotelId?.name || ''
        }
      })),
      total,
      page,
      limit
    };
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách đặt phòng: ${error.message}`);
  }
};

const getBookingDetails = async (bookingId, ownerId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotelId', 'name address ownerId')
      .populate('userId', 'name email phone')
      .select('hotelId userId details status totalPrice paymentInfo commissionAmount netPayoutAmount')
      .lean();

    if (!booking) {
      throw new Error('Đơn đặt phòng không tồn tại');
    }
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
        specialRequests: booking.details.specialRequests || ''
      },
      customer: {
        name: booking.userId?.name || 'Khách ẩn danh',
        email: booking.userId?.email || '',
        phone: booking.userId?.phone || ''
      },
      hotel: {
        name: booking.hotelId?.name || '',
        address: booking.hotelId?.address || ''
      },
      paymentInfo: {
        paymentMethod: booking.paymentInfo?.paymentMethod || 'payos',
        payoutStatus: booking.paymentInfo?.payoutStatus || 'pending'
      },
      totalPrice: booking.totalPrice || 0,
      commissionAmount: booking.commissionAmount || 0,
      netPayoutAmount: booking.netPayoutAmount || 0
    };
  } catch (error) {
    throw new Error(`Lỗi khi lấy chi tiết đặt phòng: ${error.message}`);
  }
};

const updateBookingStatus = async (bookingId, ownerId, status) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotelId', 'ownerId')
      .lean();
    if (!booking) {
      throw new Error('Đơn đặt phòng không tồn tại');
    }
    if (booking.type !== 'hotel' || !booking.hotelId || booking.hotelId.ownerId.toString() !== ownerId.toString()) {
      throw new Error('Bạn không có quyền cập nhật đơn đặt phòng này');
    }

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      refunded: []
    };
    if (!validTransitions[booking.status].includes(status)) {
      throw new Error(`Không thể chuyển từ trạng thái ${booking.status} sang ${status}`);
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    ).lean();

    return {
      _id: updatedBooking._id.toString(),
      status: updatedBooking.status,
      updatedAt: updatedBooking.updatedAt.toISOString()
    };
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật trạng thái đặt phòng: ${error.message}`);
  }
};

module.exports = {
  getPendingBookings,
  getBookingsByOwnerHotels,
  getBookingDetails,
  updateBookingStatus
};