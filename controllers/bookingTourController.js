const bookingTourService = require('../services/bookingTourService');

exports.bookTour = async (req, res) => {
  try {
    const booking = await bookingTourService.bookTour(req.user, req.body);
    res.status(201).json({ message: 'Đặt tour thành công', booking });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.refundBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await bookingTourService.refundBooking(bookingId, req.user._id);
    res.status(200).json({ message: 'Hoàn tiền thành công', transaction: result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
// Admin search
exports.searchBookings = async (req, res) => {
  console.log('✅ searchBookings route HIT');
  try {
    const bookings = await bookingTourService.searchBookings(req.query);
    res.status(200).json(bookings);
  } catch (err) {
    console.error('Error searching bookings:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// User bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await bookingTourService.getMyBookings(req.user._id);
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};