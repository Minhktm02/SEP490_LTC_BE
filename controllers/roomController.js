const roomService = require('../services/roomService');

const createRoom = async (req, res) => {
  try {
    const response = await roomService.createRoomService(req.params.hotelId, req.user._id, req.body, req.files);
    return res.status(201).json(response);
  } catch (error) {
    console.error('Lỗi khi tạo phòng:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    const response = await roomService.updateRoomService(req.params.hotelId, req.params.roomId, req.user._id, req.body, req.files);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Lỗi khi cập nhật phòng:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getRooms = async (req, res) => {
  try {
    const response = await roomService.getRoomsByHotelIdService(req.params.hotelId);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getRoomDetails = async (req, res) => {
  try {
    const response = await roomService.getRoomDetailsService(req.params.hotelId, req.params.roomId);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết phòng:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const { hotelId } = req.query;
    const response = await roomService.deleteRoomService(hotelId, req.params.id, req.user._id);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Delete room error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateRoomAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const response = await roomService.updateRoomAvailabilityService(req.params.hotelId, req.params.roomId, req.user._id, availability);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Lỗi khi cập nhật tình trạng phòng:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateRoomPrice = async (req, res) => {
  try {
    const { price } = req.body;
    const response = await roomService.updateRoomPriceService(req.params.hotelId, req.params.roomId, req.user._id, price);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Lỗi khi cập nhật giá phòng:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRoom,
  updateRoom,
  getRooms,
  getRoomDetails,
  deleteRoom,
  updateRoomAvailability,
  updateRoomPrice
};