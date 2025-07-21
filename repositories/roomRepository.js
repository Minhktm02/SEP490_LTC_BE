const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');

const createRoom = async (hotelId, ownerId, roomData) => {
  try {
    const hotel = await Hotel.findOne({ _id: hotelId, ownerId });
    if (!hotel) {
      throw new Error('Khách sạn không tồn tại hoặc bạn không có quyền');
    }
    const room = new Room({ ...roomData, hotelId });
    await room.save();
    await Hotel.findByIdAndUpdate(hotelId, { $push: { rooms: room._id } });
    return room;
  } catch (error) {
    throw new Error(`Lỗi khi tạo phòng: ${error.message}`);
  }
};

const updateRoom = async (hotelId, roomId, ownerId, updates) => {
  try {
    const hotel = await Hotel.findOne({ _id: hotelId, ownerId });
    if (!hotel) {
      throw new Error('Khách sạn không tồn tại hoặc bạn không có quyền');
    }
    const room = await Room.findOneAndUpdate(
      { _id: roomId, hotelId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!room) {
      throw new Error('Phòng không tồn tại');
    }
    return room;
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật phòng: ${error.message}`);
  }
};

const findRoomsByHotelId = async (hotelId) => {
  try {
    const rooms = await Room.find({ hotelId }).lean();
    return rooms;
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách phòng: ${error.message}`);
  }
};

const findRoomById = async (hotelId, roomId) => {
  try {
    const room = await Room.findOne({ _id: roomId, hotelId }).lean();
    if (!room) {
      throw new Error('Phòng không tồn tại');
    }
    return room;
  } catch (error) {
    throw new Error(`Lỗi khi lấy chi tiết phòng: ${error.message}`);
  }
};

const deleteRoom = async (hotelId, roomId, ownerId) => {
  try {
    const hotel = await Hotel.findOne({ _id: hotelId, ownerId });
    if (!hotel) {
      throw new Error('Khách sạn không tồn tại hoặc bạn không có quyền');
    }
    const activeBookings = await Booking.countDocuments({
      hotelId,
      roomId,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (activeBookings > 0) {
      throw new Error('Không thể xóa phòng vì còn đặt phòng đang hoạt động');
    }
    const room = await Room.findOneAndDelete({ _id: roomId, hotelId });
    if (!room) {
      throw new Error('Phòng không tồn tại');
    }
    await Hotel.findByIdAndUpdate(hotelId, { $pull: { rooms: roomId } });
    return { success: true, message: 'Xóa phòng thành công' };
  } catch (error) {
    throw new Error(`Lỗi khi xóa phòng: ${error.message}`);
  }
};

const updateRoomAvailability = async (hotelId, roomId, ownerId, availability) => {
  try {
    const hotel = await Hotel.findOne({ _id: hotelId, ownerId });
    if (!hotel) {
      throw new Error('Khách sạn không tồn tại hoặc bạn không có quyền');
    }
    const room = await Room.findOneAndUpdate(
      { _id: roomId, hotelId },
      { $set: { availability } },
      { new: true, runValidators: true }
    );
    if (!room) {
      throw new Error('Phòng không tồn tại');
    }
    return room;
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật tình trạng phòng: ${error.message}`);
  }
};

const updateRoomPrice = async (hotelId, roomId, ownerId, price) => {
  try {
    const hotel = await Hotel.findOne({ _id: hotelId, ownerId });
    if (!hotel) {
      throw new Error('Khách sạn không tồn tại hoặc bạn không có quyền');
    }
    const room = await Room.findOneAndUpdate(
      { _id: roomId, hotelId },
      { $set: { price } },
      { new: true, runValidators: true }
    );
    if (!room) {
      throw new Error('Phòng không tồn tại');
    }
    return room;
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật giá phòng: ${error.message}`);
  }
};

module.exports = {
  createRoom,
  updateRoom,
  findRoomsByHotelId,
  findRoomById,
  deleteRoom,
  updateRoomAvailability,
  updateRoomPrice
};