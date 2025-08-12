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

exports.searchTours = async (query) => {
  const {
    search, type, serviceType, hasGuide, allowPrivateBooking,
    priceMin, priceMax, ratingMin, dateFrom, providerId, status
  } = query;

  const andFilters = [];

  // ====== Filter by fixed fields ======
  if (type) andFilters.push({ type });
  if (serviceType) andFilters.push({ serviceType });
  if (status) andFilters.push({ status });
  if (providerId) andFilters.push({ providerId });

  if (hasGuide !== undefined) {
    andFilters.push({ hasGuide: hasGuide === 'true' });
  }

  if (allowPrivateBooking !== undefined) {
    andFilters.push({ allowPrivateBooking: allowPrivateBooking === 'true' });
  }

  // ====== Filter by price range on 3 fields ======
  if (priceMin || priceMax) {
    const priceRange = {};
    if (priceMin) priceRange.$gte = Number(priceMin);
    if (priceMax) priceRange.$lte = Number(priceMax);

    andFilters.push({
      $or: [
        { price: priceRange },
        { priceAdult: priceRange },
        { priceChild: priceRange }
      ]
    });
  }

  // ====== Filter by rating ======
  if (ratingMin) {
    andFilters.push({ rating: { $gte: Number(ratingMin) } });
  }

  // ====== Keyword search (name, description) ======
  if (search) {
    andFilters.push({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    });
  }

  // ====== Filter by date (availability array) ======
  if (dateFrom) {
    andFilters.push({
      availability: {
        $elemMatch: {
          date: { $gte: new Date(dateFrom) },
          status: 'available'
        }
      }
    });
  }

  // ====== Final filter ======
  const finalFilter = andFilters.length > 0 ? { $and: andFilters } : {};

  return tourRepo.search(finalFilter);
};

exports.getTourById = (id) => tourRepo.findById(id);

exports.updateTour = async (id, updates) => {
  if (updates.serviceType === 'guided_tour' && updates.hasGuide !== true) {
    throw new Error("Tour có hướng dẫn viên cần hasGuide = true");
  }
  return tourRepo.updateById(id, updates);
};

exports.deleteTour = (id) => tourRepo.softDeleteById(id);
