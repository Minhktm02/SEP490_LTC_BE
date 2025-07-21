const bookingRepository = require('../repositories/bookingRepository');
const mongoose = require('mongoose');

const getPendingBookingsService = async (ownerId, filters, page, limit) => {
  try {
    if (page < 1 || limit < 1) {
      throw new Error('Trang và giới hạn phải lớn hơn 0');
    }
    if (filters.hotelId && !mongoose.Types.ObjectId.isValid(filters.hotelId)) {
      throw new Error('ID khách sạn không hợp lệ');
    }
    return await bookingRepository.getPendingBookings(ownerId, filters, page, limit);
  } catch (error) {
    throw new Error(`Lỗi dịch vụ khi lấy danh sách đặt phòng cần xác nhận: ${error.message}`);
  }
};

const getBookingsByOwnerHotelsService = async (ownerId, filters, page, limit) => {
  try {
    if (page < 1 || limit < 1) {
      throw new Error('Trang và giới hạn phải lớn hơn 0');
    }
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'];
    if (filters.status && !validStatuses.includes(filters.status)) {
      throw new Error('Trạng thái không hợp lệ');
    }
    if (filters.hotelId && !mongoose.Types.ObjectId.isValid(filters.hotelId)) {
      throw new Error('ID khách sạn không hợp lệ');
    }
    if (filters.fromDate && isNaN(new Date(filters.fromDate))) {
      throw new Error('Ngày bắt đầu không hợp lệ');
    }
    if (filters.toDate && isNaN(new Date(filters.toDate))) {
      throw new Error('Ngày kết thúc không hợp lệ');
    }
    if (filters.fromDate && filters.toDate && new Date(filters.fromDate) > new Date(filters.toDate)) {
      throw new Error('Ngày bắt đầu phải trước ngày kết thúc');
    }
    return await bookingRepository.getBookingsByOwnerHotels(ownerId, filters, page, limit);
  } catch (error) {
    throw new Error(`Lỗi dịch vụ khi lấy danh sách đặt phòng: ${error.message}`);
  }
};

const getBookingDetailsService = async (bookingId, ownerId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new Error('ID đặt phòng không hợp lệ');
    }
    return await bookingRepository.getBookingDetails(bookingId, ownerId);
  } catch (error) {
    throw new Error(`Lỗi dịch vụ khi lấy chi tiết đặt phòng: ${error.message}`);
  }
};

const updateBookingStatusService = async (bookingId, ownerId, status) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new Error('ID đặt phòng không hợp lệ');
    }
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new Error('Trạng thái không hợp lệ');
    }
    return await bookingRepository.updateBookingStatus(bookingId, ownerId, status);
  } catch (error) {
    throw new Error(`Lỗi dịch vụ khi cập nhật trạng thái đặt phòng: ${error.message}`);
  }
};

module.exports = {
  getPendingBookingsService,
  getBookingsByOwnerHotelsService,
  getBookingDetailsService,
  updateBookingStatusService
};