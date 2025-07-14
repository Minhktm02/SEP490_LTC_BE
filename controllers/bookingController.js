const bookingService = require('../services/bookingService');

const getPendingBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, hotelId } = req.query;
    const filters = { hotelId };
    const response = await bookingService.getPendingBookingsService(
      req.user._id,
      filters,
      parseInt(page),
      parseInt(limit)
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đặt phòng cần xác nhận:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getBookingsByOwnerHotels = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, hotelId, fromDate, toDate } = req.query;
    const filters = { status, hotelId, fromDate, toDate };
    const response = await bookingService.getBookingsByOwnerHotelsService(
      req.user._id,
      filters,
      parseInt(page),
      parseInt(limit)
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đặt phòng:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getBookingDetails = async (req, res) => {
  try {
    const response = await bookingService.getBookingDetailsService(req.params.id, req.user._id);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đặt phòng:', error.message);
    return res.status(error.message.includes('quyền') ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const response = await bookingService.updateBookingStatusService(req.params.id, req.user._id, status);
    return res.status(200).json({
      message: 'Trạng thái đã được cập nhật',
      booking: response
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái đặt phòng:', error.message);
    return res.status(error.message.includes('quyền') ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
};
const createBooking = async (req, res) => {
  try {
    const userId = req.user._id?.toString?.(); // ✅ FIXED
    console.log('Dữ liệu body nhận được:', req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: 'Body request không được gửi hoặc rỗng' });
    }

    const bookingData = req.body;
    const result = await bookingService.createBookingService(userId, bookingData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Lỗi trong createBooking:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};


module.exports = {
  getPendingBookings,
  getBookingsByOwnerHotels,
  getBookingDetails,
  updateBookingStatus,
  createBooking
};