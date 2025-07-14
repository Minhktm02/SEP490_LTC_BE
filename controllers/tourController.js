const Tour = require("../models/Tour");

// Tạo tour
exports.createTour = async (req, res) => {
  try {
    const {
      name, description, providerId, itinerary,
      duration, type, serviceType, hasGuide,
      allowPrivateBooking, price, priceAdult, priceChild,
      availability, images, meals, hotels, transport
    } = req.body;

    // Validate serviceType liên quan đến hasGuide
    if (serviceType === 'guided_tour' && hasGuide !== true) {
      return res.status(400).json({ message: "Tour có hướng dẫn viên cần hasGuide = true" });
    }

    if (serviceType === 'ticket' && (!availability || availability.length === 0)) {
      return res.status(400).json({ message: "Vé tham quan phải có ít nhất 1 ngày sử dụng" });
    }

    const tour = new Tour({
      name, description, providerId, itinerary,
      duration, type, serviceType, hasGuide,
      allowPrivateBooking, price, priceAdult, priceChild,
      availability, images, meals, hotels, transport
    });

    await tour.save();
    res.status(201).json(tour);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy tất cả tour (có thể thêm filter sau)
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find();
    res.json(tours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy tour theo ID
exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });
    res.json(tour);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật tour
exports.updateTour = async (req, res) => {
  try {
    const updates = req.body;

    // Nếu thay đổi serviceType, kiểm tra logic liên quan
    if (updates.serviceType === 'guided_tour' && updates.hasGuide !== true) {
      return res.status(400).json({ message: "Tour có hướng dẫn viên cần hasGuide = true" });
    }

    const tour = await Tour.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!tour) return res.status(404).json({ message: "Tour not found" });
    res.json(tour);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xóa mềm tour (inactive)
exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    tour.status = 'inactive';
    await tour.save();
    res.json({ message: "Tour deactivated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
