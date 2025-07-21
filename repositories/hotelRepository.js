const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Review = require('../models/Review');
const User = require('../models/User');

const createHotel = async (hotelData) => {
  try {
    const hotel = new Hotel(hotelData);
    return await hotel.save();
  } catch (error) {
    throw new Error(`Lỗi khi tạo khách sạn: ${error.message}`);
  }
};

const findHotelsByOwnerId = async (ownerId) => {
  try {
    return await Hotel.find({ ownerId })
      .select('name address description images amenities status createdAt updatedAt additionalInfo rating')
      .lean();
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách khách sạn: ${error.message}`);
  }
};

const findHotelById = async (hotelId, ownerId) => {
  try {
    return await Hotel.findOne({ _id: hotelId, ownerId })
      .select('name address description images amenities status createdAt updatedAt additionalInfo rating rooms location')
      .populate('rooms')
      .lean();
  } catch (error) {
    throw new Error(`Lỗi khi lấy chi tiết khách sạn: ${error.message}`);
  }
};

const getHotelDetails = async (hotelId, filters = {}) => {
  try {
    const { checkInDate, checkOutDate, numberOfPeople } = filters;
    const roomQuery = { hotelId, status: 'active' };
    if (checkInDate && checkOutDate && numberOfPeople) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      if (!isNaN(checkIn) && !isNaN(checkOut) && numberOfPeople > 0) {
        roomQuery.availability = {
          $elemMatch: {
            date: { $gte: checkIn, $lte: checkOut },
            quantity: { $gte: parseInt(numberOfPeople) }
          }
        };
        roomQuery.maxPeople = { $gte: parseInt(numberOfPeople) };
      }
    }
    const hotel = await Hotel.findOne({ _id: hotelId, status: 'active' })
      .select('name address description images amenities rating reviewCount status createdAt updatedAt additionalInfo location')
      .populate({
        path: 'rooms',
        match: roomQuery,
        select: 'roomType price availability status description amenities images maxPeople area'
      })
      .lean();

    if (!hotel) {
      throw new Error('Khách sạn không tồn tại hoặc không hoạt động');
    }
    const reviews = await Review.find({ hotelId })
      .select('userId comment createdAt')
      .lean();
    const userIds = reviews.map(review => review.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name')
      .lean();
    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = user.name || 'Khách ẩn danh';
      return map;
    }, {});
    
    return {
      basicInfo: {
        name: hotel.name || '',
        address: hotel.address || '',
        location: {
          latitude: hotel.location.coordinates[1] || 0,
          longitude: hotel.location.coordinates[0] || 0
        },
        description: hotel.description || ''
      },
      images: hotel.images || [],
      amenities: hotel.amenities || [],
      rating: {
        average: hotel.rating || 0,
        reviewCount: hotel.reviewCount || reviews.length
      },
      rooms: hotel.rooms ? hotel.rooms.map(room => ({
        id: room._id.toString(),
        name: room.roomType || '',
        pricePerNight: room.price || 0,
        maxPeople: room.maxPeople || 2,
        area: room.area || 0,
        amenities: room.amenities || [],
        availability: room.availability ? room.availability.map(slot => ({
          date: slot.date,
          available: slot.quantity > 0,
          quantity: slot.quantity
        })) : [],
        description: room.description || '',
        images: room.images || []
      })) : [],
      reviews: reviews.map(review => ({
        username: userMap[review.userId.toString()] || 'Khách ẩn danh',
        content: review.comment || '',
        date: review.createdAt || new Date()
      })),
      policies: {
        checkInTime: hotel.additionalInfo?.policies?.checkInTime || '',
        checkOutTime: hotel.additionalInfo?.policies?.checkOutTime || '',
        cancellation: hotel.additionalInfo?.policies?.cancellation || '',
        payment: hotel.additionalInfo?.policies?.depositRequired ? 'Yêu cầu đặt cọc' : 'Không yêu cầu đặt cọc'
      },
      contact: {
        phone: hotel.additionalInfo?.contact?.phone || '',
        email: hotel.additionalInfo?.contact?.email || '',
        website: hotel.additionalInfo?.contact?.website || ''
      }
    };
  } catch (error) {
    throw new Error(`Lỗi khi lấy chi tiết khách sạn: ${error.message}`);
  }
};

const updateHotel = async (hotelId, ownerId, updates) => {
  try {
    return await Hotel.findOneAndUpdate(
      { _id: hotelId, ownerId },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).select('name address description images amenities status createdAt updatedAt additionalInfo rating rooms location')
      .populate('rooms');
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật khách sạn: ${error.message}`);
  }
};

const deleteHotel = async (hotelId, ownerId) => {
  try {
    const activeBookings = await Booking.countDocuments({
      hotelId,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (activeBookings > 0) {
      throw new Error('Không thể xóa khách sạn vì còn đặt phòng đang hoạt động');
    }
    return await Hotel.findOneAndDelete({ _id: hotelId, ownerId });
  } catch (error) {
    throw new Error(`Lỗi khi xóa khách sạn: ${error.message}`);
  }
};

const searchHotelsHandler = async (filters, page = 1, limit = 10) => {
  try {
    const {
      location,
      checkInDate,
      checkOutDate,
      numberOfPeople,
      roomType,
      minPrice,
      maxPrice,
      amenities,
      category,
      minRating,
      maxRating,
      hasPromotion
    } = filters;

    const query = { status: 'active' };

    if (location) {
      query.address = { $regex: location, $options: 'i' };
    }

    if (amenities) {
      const amenitiesArray = typeof amenities === 'string' ? amenities.split(',') : amenities;
      if (Array.isArray(amenitiesArray) && amenitiesArray.length) {
        query.amenities = { $all: amenitiesArray };
      }
    }

    if (category) {
      const categories = typeof category === 'string' ? category.split(',') : Array.isArray(category) ? category : [category];
      query['additionalInfo.category'] = { $in: categories };
    }

    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseFloat(minRating) || 0;
      if (maxRating) query.rating.$lte = parseFloat(maxRating) || 5;
    }

    const roomQuery = {};
    if (minPrice || maxPrice) {
      roomQuery.price = {};
      if (minPrice) roomQuery.price.$gte = parseFloat(minPrice) || 0;
      if (maxPrice) roomQuery.price.$lte = parseFloat(maxPrice) || Number.MAX_SAFE_INTEGER;
    }

    if (roomType) {
      roomQuery.roomType = roomType;
    }

    if (hasPromotion) {
      roomQuery.promotion = { $exists: true, $ne: null };
    }

    if (checkInDate && checkOutDate && numberOfPeople) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      if (!isNaN(checkIn) && !isNaN(checkOut) && numberOfPeople > 0) {
        roomQuery.availability = {
          $elemMatch: {
            date: { $gte: checkIn, $lte: checkOut },
            quantity: { $gte: parseInt(numberOfPeople) || 1 }
          }
        };
      }
    }

    const matchingRooms = await Room.find(roomQuery).select('_id hotelId').lean();
    const matchingHotelIds = [...new Set(matchingRooms.map(room => room.hotelId.toString()))];

    if (Object.keys(roomQuery).length > 0) {
      query._id = { $in: matchingHotelIds };
    }

    const skip = (page - 1) * limit;
    const [hotels, total] = await Promise.all([
      Hotel.find(query)
        .select('name address description images amenities rating status createdAt updatedAt additionalInfo rooms location')
        .populate({
          path: 'rooms',
          match: roomQuery
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      Hotel.countDocuments(query)
    ]);

    return {
      items: hotels,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw new Error(`Lỗi khi tìm kiếm khách sạn: ${error.message}`);
  }
};
const getAllHotels = async () => {
  return await Hotel.find()
    .populate({
      path: 'rooms',
      select: 'pricePerNight'
    })
    .select('name images address rating reviewCount')
    .lean();
};
module.exports = {
  createHotel,
  findHotelsByOwnerId,
  findHotelById,
  getHotelDetails,
  updateHotel,
  deleteHotel,
  searchHotelsHandler,
  getAllHotels
};