const hotelRepository = require('../repositories/hotelRepository');
const cloudinary = require('../config/cloudinary');

const createHotelService = async (ownerId, data, files) => {
  const { name, address, description, location, amenities, policies, category, contact } = data;

  let images = [];
  if (files && files.length > 0) {
    try {
      images = await Promise.all(
        files.map(file =>
          new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'hotels', resource_type: 'image' },
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

  const hotelData = {
    ownerId,
    name: name || '',
    address: address || '',
    description: description || '',
    location: location ? {
      type: 'Point',
      coordinates: typeof location === 'string' ? JSON.parse(location).coordinates : (location.coordinates || [0, 0])
    } : { type: 'Point', coordinates: [0, 0] },
    images,
    amenities: amenities ? (typeof amenities === 'string' ? amenities.split(',') : amenities) : [],
    rooms: [],
    status: 'pending',
    rating: 0,
    reviewCount: 0,
    reviews: [],
    additionalInfo: {
      policies: policies ? (typeof policies === 'string' ? JSON.parse(policies) : policies) : {},
      category: category || 'hotel',
      contact: contact ? (typeof contact === 'string' ? JSON.parse(contact) : contact) : {}
    }
  };

  const hotel = await hotelRepository.createHotel(hotelData);
  return { success: true, message: 'Tạo khách sạn thành công', data: hotel };
};

const getHotelsService = async (ownerId) => {
  const hotels = await hotelRepository.findHotelsByOwnerId(ownerId);
  return { success: true, message: 'Lấy danh sách khách sạn thành công', data: hotels };
};

const getHotelService = async (hotelId, ownerId) => {
  const hotel = await hotelRepository.findHotelById(hotelId, ownerId);
  if (!hotel) {
    throw new Error('Khách sạn không tồn tại hoặc bạn không có quyền');
  }
  return { success: true, message: 'Lấy chi tiết khách sạn thành công', data: hotel };
};

const getHotelDetailsService = async (hotelId, filters) => {
  try {
    if (filters.checkInDate && filters.checkOutDate) {
      const checkIn = new Date(filters.checkInDate);
      const checkOut = new Date(filters.checkOutDate);
      if (isNaN(checkIn) || isNaN(checkOut)) {
        throw new Error('Ngày check-in hoặc check-out không hợp lệ');
      }
      if (checkIn >= checkOut) {
        throw new Error('Ngày check-in phải trước ngày check-out');
      }
    }
    if (filters.numberOfPeople && filters.numberOfPeople <= 0) {
      throw new Error('Số lượng người phải lớn hơn 0');
    }

    return await hotelRepository.getHotelDetails(hotelId, filters);
  } catch (error) {
    throw new Error(`Lỗi khi lấy chi tiết khách sạn: ${error.message}`);
  }
};

const updateHotelService = async (hotelId, ownerId, data, files) => {
  const { name, address, description, location, amenities, additionalInfo } = data;

  let images = [];
  if (files && files.length > 0) {
    try {
      images = await Promise.all(
        files.map(file =>
          new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'hotels', resource_type: 'image' },
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

  const updates = {};
  if (name) updates.name = name;
  if (address) updates.address = address;
  if (description) updates.description = description;
  if (location) {
    updates.location = {
      type: 'Point',
      coordinates: typeof location === 'string' ? JSON.parse(location).coordinates : location.coordinates
    };
  }
  if (amenities) updates.amenities = typeof amenities === 'string' ? amenities.split(',') : amenities;
  if (images.length > 0) updates.images = images;
  if (additionalInfo) {
    updates.additionalInfo = typeof additionalInfo === 'string' ? JSON.parse(additionalInfo) : additionalInfo;
  }

  const hotel = await hotelRepository.updateHotel(hotelId, ownerId, updates);
  if (!hotel) {
    throw new Error('Khách sạn không tồn tại hoặc bạn không có quyền');
  }
  return { success: true, message: 'Cập nhật khách sạn thành công', data: hotel };
};

const deleteHotelService = async (hotelId, ownerId) => {
  const hotel = await hotelRepository.deleteHotel(hotelId, ownerId);
  if (!hotel) {
    throw new Error('Khách sạn không tồn tại hoặc bạn không có quyền');
  }
  return { success: true, message: 'Xóa khách sạn thành công' };
};

const searchHotelsService = async (filters, page, limit) => {
  try {
    const result = await hotelRepository.searchHotelsHandler(filters, parseInt(page) || 1, parseInt(limit) || 10);
    return {
      success: true,
      message: 'Tìm kiếm khách sạn thành công',
      data: {
        items: result.items,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      }
    };
  } catch (error) {
    throw new Error(`Lỗi khi tìm kiếm khách sạn: ${error.message}`);
  }
};

const calculateMinPrice = (rooms) => {
  if (!rooms || rooms.length === 0) return null;
  const prices = rooms
    .filter(room => room.pricePerNight)
    .map(room => room.pricePerNight);
  return prices.length > 0 ? Math.min(...prices) : null;
};

const getAllHotels = async () => {
  const hotels = await hotelRepository.getAllHotels();
  
  return hotels.map(hotel => ({
    image: hotel.images && hotel.images.length > 0 ? hotel.images[0] : null,
    name: hotel.name,
    rating: hotel.rating || 0,
    address: hotel.address,
    reviewNumber: hotel.reviewCount || 0,
    price: calculateMinPrice(hotel.rooms)
  }));
};
module.exports = {
  createHotelService,
  getHotelsService,
  getHotelService,
  getHotelDetailsService,
  updateHotelService,
  deleteHotelService,
  searchHotelsService,
  getAllHotels
};