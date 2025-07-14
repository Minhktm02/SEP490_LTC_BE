const Review = require('../models/Review');

const findReviewsByHotelId = async (hotelId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find({ hotelId })
        .select('userId rating comment images criteria createdAt')
        .populate('userId', 'name profile.avatar')
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ hotelId })
    ]);

    return {
      items: reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw new Error(`Lỗi khi lấy đánh giá khách sạn: ${error.message}`);
  }
};

const findByHotelId = async (hotelId) => {
  return await Review.find({ hotelId })
    .select('userId comment createdAt')
    .lean();
};

module.exports = {
  findReviewsByHotelId,
  findByHotelId
};