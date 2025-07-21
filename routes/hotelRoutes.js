const express = require('express');
const router = express.Router();

const hotelController = require('../controllers/hotelController');
const roomController = require('../controllers/roomController');

const {
  authMiddleware,
  roleMiddleware
} = require('../middleware/authMiddleware');

const upload = require('../utils/upload');

// PUBLIC ROUTES
router.get('/search/hotels', hotelController.searchHotelsHandler);
router.get('/details/:hotelId', hotelController.getHotelDetails);
router.get('/:hotelId/rooms/:roomId', roomController.getRoomDetails);
router.get ('/All', hotelController.getAllHotels);

// HOTEL OWNER ROUTES
router.post('/create', authMiddleware, roleMiddleware(['hotel_owner']), upload.array('images', 5), hotelController.createHotel);
router.get('/my', authMiddleware, roleMiddleware(['hotel_owner']), hotelController.getHotels);
router.get('/:id', authMiddleware, roleMiddleware(['hotel_owner']), hotelController.getHotel);
router.put('/:id', authMiddleware, roleMiddleware(['hotel_owner']), upload.array('images', 5), hotelController.updateHotel);
router.delete('/:id', authMiddleware, roleMiddleware(['hotel_owner']), hotelController.deleteHotel);

router.post('/:hotelId/room', authMiddleware, roleMiddleware(['hotel_owner']), upload.array('images', 5), roomController.createRoom);
router.get('/:hotelId/room', authMiddleware, roleMiddleware(['hotel_owner']), roomController.getRooms);
router.patch('/:hotelId/room/:roomId', authMiddleware, roleMiddleware(['hotel_owner']), upload.array('images', 5), roomController.updateRoom);
router.delete('/:hotelId/room/:roomId', authMiddleware, roleMiddleware(['hotel_owner']), roomController.deleteRoom);
router.patch('/:hotelId/room/:roomId/availability', authMiddleware, roleMiddleware(['hotel_owner']), roomController.updateRoomAvailability);
router.patch('/:hotelId/room/:roomId/price', authMiddleware, roleMiddleware(['hotel_owner']), roomController.updateRoomPrice);


module.exports = router;
