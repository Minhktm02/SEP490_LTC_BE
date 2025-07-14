const Tour = require("../models/Tour");
const TourBooking = require("../models/TourBooking");
const { ObjectId } = require("mongodb");
exports.bookTour = async (req, res) => {
  try {
    const {
      tourId,
      availabilityId,
      quantityAdult = 1,
      quantityChild = 0,
      isPrivateBooking = false,
      note,
      payment = { method: 'paypal' }
    } = req.body;

    if (!payment || payment.method !== 'paypal') {
      return res.status(400).json({ message: "Hiện tại chỉ hỗ trợ thanh toán qua PayPal." });
    }

    const customerId = req.user?._id || req.body.customerId;
    if (!customerId) {
      return res.status(401).json({ message: "Vui lòng đăng nhập để đặt tour" });
    }
    if (!availabilityId || typeof availabilityId !== "string") {
      return res.status(400).json({ message: "Thiếu hoặc sai availabilityId" });
    }

    const tour = await Tour.findById(tourId);
    if (!tour || tour.status !== 'active') {
      return res.status(404).json({ message: "Tour không tồn tại hoặc không hoạt động" });
    }

    if (isPrivateBooking) {
      if (tour.serviceType !== 'guided_tour' || !tour.allowPrivateBooking) {
        return res.status(400).json({ message: "Tour này không hỗ trợ đặt riêng" });
      }
    }

    const availability = tour.availability.find(
      (a) => a._id.toString() === availabilityId
    );

    if (!availability) {
      return res.status(400).json({ message: "Không tìm thấy ngày khởi hành tương ứng" });
    }

    const totalPeople = quantityAdult + quantityChild;

    if (!isPrivateBooking) {
      if (availability.slots < totalPeople) {
        return res.status(400).json({ message: `Chỉ còn ${availability.slots} chỗ cho ngày này` });
      }
      availability.slots -= totalPeople;
    } else {
      availability.isPrivate = true;
    }

    const priceAdult = tour.priceAdult || tour.price;
    const priceChild = tour.priceChild || tour.price;
    const totalPrice = quantityAdult * priceAdult + quantityChild * priceChild;

    const booking = new TourBooking({
      tourId,
      customerId,
      availabilityId,
      quantityAdult,
      quantityChild,
      isPrivateBooking,
      totalPrice,
      payment,
      status: 'pending',
      note
    });

    await booking.save();
    await tour.save();

    res.status(201).json({ message: "Đặt tour thành công", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
