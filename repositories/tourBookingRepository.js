const TourBooking = require('../models/TourBooking');

exports.create = (data) => new TourBooking(data).save();

exports.findById = (id) => TourBooking.findById(id);

exports.updateStatus = (id, status) =>
  TourBooking.findByIdAndUpdate(id, { status }, { new: true });

exports.saveTour = (tour) => tour.save();
