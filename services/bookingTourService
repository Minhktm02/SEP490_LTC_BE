const Tour = require('../models/Tour');
const tourRepo = require('../repositories/tourBookingRepository');
const transactionRepo = require('../repositories/transactionRepository');

exports.bookTour = async (user, body) => {
  const {
    tourId, availabilityId, quantityAdult = 1, quantityChild = 0,
    isPrivateBooking = false, note, payment = { method: 'paypal' }
  } = body;

  if (!payment || !['paypal', 'momo', 'vnpay', 'cash'].includes(payment.method)) {
    throw new Error('Phương thức thanh toán không hợp lệ');
  }

  const tour = await Tour.findById(tourId);
  if (!tour || tour.status !== 'active') {
    throw new Error('Tour không tồn tại hoặc không hoạt động');
  }

  const availability = tour.availability.find(a => a._id.toString() === availabilityId);
  if (!availability) throw new Error('Không tìm thấy ngày khởi hành');

  const totalPeople = quantityAdult + quantityChild;
  if (!isPrivateBooking && availability.slots < totalPeople) {
    throw new Error(`Chỉ còn ${availability.slots} chỗ`);
  }

  if (!isPrivateBooking) {
    availability.slots -= totalPeople;
  } else {
    availability.isPrivate = true;
  }

  const totalPrice = quantityAdult * (tour.priceAdult || tour.price) +
                     quantityChild * (tour.priceChild || tour.price);

  const booking = await tourRepo.create({
    tourId,
    customerId: user._id,
    availabilityId,
    quantityAdult,
    quantityChild,
    totalPrice,
    isPrivateBooking,
    payment,
    status: 'pending',
    note
  });

  await tourRepo.saveTour(tour);
  return booking;
};

exports.refundBooking = async (bookingId, userId) => {
  const booking = await tourRepo.findById(bookingId);
  if (!booking) throw new Error('Không tìm thấy booking');

  if (booking.customerId.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền hoàn đơn này');
  }

  if (!['confirmed', 'completed'].includes(booking.status)) {
    throw new Error('Chỉ hoàn tiền đơn đã xác nhận hoặc hoàn thành');
  }

  const tour = await Tour.findById(booking.tourId).select('providerId');
  if (!tour) throw new Error('Không tìm thấy tour tương ứng');

  await tourRepo.updateStatus(bookingId, 'refunded');

  const transaction = await transactionRepo.create({
    userId,
    type: 'refund',
    direction: 'out',
    amount: booking.totalPrice,
    method: booking.payment.method,
    status: 'pending',
    transactionId: `REF_${Date.now()}`,
    tourBookingId: booking._id,
    details: {
      businessUserId: tour.providerId,
      commission: 0,
      completedAt: null
    }
  });

  return transaction;
};
//Admin search
exports.searchBookings = async (query) => {
  const { status, tourId, customerId, paymentStatus } = query;
  const filter = {};
  if (status) filter.status = status;
  if (tourId) filter.tourId = tourId;
  if (customerId) filter.customerId = customerId;
  if (paymentStatus) filter['payment.status'] = paymentStatus;

  return await tourRepo.search(filter);
};

//User view their own bookings
exports.getMyBookings = async (userId) => {
  return await tourRepo.findByCustomer(userId);
};