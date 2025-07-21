const tourRepo = require('../repositories/tourRepository');

exports.createTour = async (body) => {
  const {
    name, description, providerId, itinerary,
    duration, type, serviceType, hasGuide,
    allowPrivateBooking, price, priceAdult, priceChild,
    availability, images, meals, hotels, transport
  } = body;

  if (serviceType === 'guided_tour' && hasGuide !== true) {
    throw new Error("Tour có hướng dẫn viên cần hasGuide = true");
  }

  if (serviceType === 'ticket' && (!availability || availability.length === 0)) {
    throw new Error("Vé tham quan phải có ít nhất 1 ngày sử dụng");
  }

  return await tourRepo.create({
    name, description, providerId, itinerary,
    duration, type, serviceType, hasGuide,
    allowPrivateBooking, price, priceAdult, priceChild,
    availability, images, meals, hotels, transport
  });
};

exports.getAllTours = () => tourRepo.findAll();

exports.getTourById = (id) => tourRepo.findById(id);

exports.updateTour = async (id, updates) => {
  if (updates.serviceType === 'guided_tour' && updates.hasGuide !== true) {
    throw new Error("Tour có hướng dẫn viên cần hasGuide = true");
  }
  return tourRepo.updateById(id, updates);
};

exports.deleteTour = (id) => tourRepo.softDeleteById(id);
