const roomRepository = require('../repositories/roomRepository');
const cloudinary = require('../config/cloudinary');

const createRoomService = async (hotelId, ownerId, data, files) => {
  let images = [];
  if (files && files.length > 0) {
    try {
      images = await Promise.all(
        files.map(file =>
          new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'rooms', resource_type: 'image' },
              (error, result) => {
                if (error) reject(new Error('Lỗi khi tải ảnh lên'));
                resolve(result.secure_url);
              }
            ).end(file.buffer);
          })
        )
      );
    } catch (error) {
      throw new Error(`Lỗi khi tải ảnh lên: ${error.message}`);
    }
  }

  const { roomType, price, availability, status, description, amenities, promotion } = data;

  const roomData = {
    roomType: roomType || '',
    price: parseFloat(price) || 0,
    availability: availability ? (typeof availability === 'string' ? JSON.parse(availability) : availability) : [],
    status: status || 'pending',
    description: description || '',
    amenities: amenities ? (typeof amenities === 'string' ? amenities.split(',') : amenities) : [],
    images,
    promotion: promotion ? (typeof promotion === 'string' ? JSON.parse(promotion) : promotion) : null
  };

  const room = await roomRepository.createRoom(hotelId, ownerId, roomData);
  return { success: true, message: 'Tạo phòng thành công', data: room };
};

const updateRoomService = async (hotelId, roomId, ownerId, data, files) => {
  let images = [];
  if (files && files.length > 0) {
    try {
      images = await Promise.all(
        files.map(file =>
          new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'rooms', resource_type: 'image' },
              (error, result) => {
                if (error) reject(new Error('Lỗi khi tải ảnh lên'));
                resolve(result.secure_url);
              }
            ).end(file.buffer);
          })
        )
      );
    } catch (error) {
      throw new Error(`Lỗi khi tải ảnh lên: ${error.message}`);
    }
  }

  const { roomType, price, availability, status, description, amenities, promotion } = data;

  const updates = {};
  if (roomType) updates.roomType = roomType;
  if (price) updates.price = parseFloat(price);
  if (availability) updates.availability = typeof availability === 'string' ? JSON.parse(availability) : availability;
  if (status) updates.status = status;
  if (description) updates.description = description;
  if (amenities) updates.amenities = typeof amenities === 'string' ? amenities.split(',') : amenities;
  if (images.length > 0) updates.images = images;
  if (promotion) updates.promotion = typeof promotion === 'string' ? JSON.parse(promotion) : promotion;

  const room = await roomRepository.updateRoom(hotelId, roomId, ownerId, updates);
  return { success: true, message: 'Cập nhật phòng thành công', data: room };
};

const getRoomsByHotelIdService = async (hotelId) => {
  const rooms = await roomRepository.findRoomsByHotelId(hotelId);
  return { success: true, message: 'Lấy danh sách phòng thành công', data: rooms };
};

const getRoomDetailsService = async (hotelId, roomId) => {
  const room = await roomRepository.findRoomById(hotelId, roomId);
  return { success: true, message: 'Lấy chi tiết phòng thành công', data: room };
};

const deleteRoomService = async (hotelId, roomId, ownerId) => {
  await roomRepository.deleteRoom(hotelId, roomId, ownerId);
  return { success: true, message: 'Xóa phòng thành công' };
};

const updateRoomAvailabilityService = async (hotelId, roomId, ownerId, availability) => {
  const room = await roomRepository.updateRoomAvailability(hotelId, roomId, ownerId, availability);
  return { success: true, message: 'Cập nhật tình trạng phòng thành công', data: room };
};

const updateRoomPriceService = async (hotelId, roomId, ownerId, price) => {
  const room = await roomRepository.updateRoomPrice(hotelId, roomId, ownerId, parseFloat(price) || 0);
  return { success: true, message: 'Cập nhật giá phòng thành công', data: room };
};

module.exports = {
  createRoomService,
  updateRoomService,
  getRoomsByHotelIdService,
  getRoomDetailsService,
  deleteRoomService,
  updateRoomAvailabilityService,
  updateRoomPriceService
};