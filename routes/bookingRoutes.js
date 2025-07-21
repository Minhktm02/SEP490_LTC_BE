const express = require('express');
const bookingController = require('../controllers/bookingController.js');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// get list bookings request by user (status: pending)
router.get('/requests', authMiddleware, roleMiddleware(['hotel_owner']), bookingController.getPendingBookings);

// get all bookings room 
router.get('/my-hotels', authMiddleware, roleMiddleware(['hotel_owner']), bookingController.getBookingsByOwnerHotels);

// detail bookings
router.get('/:id', authMiddleware, roleMiddleware(['hotel_owner']), bookingController.getBookingDetails);

// confirm booking
router.put('/:id/status', authMiddleware, roleMiddleware('hotel_owner'), bookingController.updateBookingStatus);



module.exports = router;