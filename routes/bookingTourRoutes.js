const express = require('express');
const router = express.Router();
const bookingTourController = require('../controllers/bookingTourController');
const { authMiddleware } = require('../middleware/authMiddleware');

// POST /api/tour-bookings
router.post('/', authMiddleware, bookingTourController.bookTour);

// POST /api/tour-bookings/:bookingId/refund
router.post('/:bookingId/refund', authMiddleware, bookingTourController.refundBooking);

// GET /api/tour-bookings/search
router.get('/search', authMiddleware, bookingTourController.searchBookings);

// GET /api/tour-bookings/my
router.get('/my', authMiddleware, bookingTourController.getMyBookings);

module.exports = router;
