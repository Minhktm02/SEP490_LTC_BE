const TourBooking = require('../models/TourBooking');

exports.create = (data) => new TourBooking(data).save();

exports.findById = (id) => TourBooking.findById(id);

exports.updateStatus = (id, status) =>
  TourBooking.findByIdAndUpdate(id, { status }, { new: true });

exports.search = (filter) => 
  TourBooking.find(filter)
    .populate('tourId')
    .populate('customerId')
    .populate('availabilityId')
    .exec();

exports.findByCustomer = (customerId) =>
  TourBooking.find({ customerId })
    .populate('tourId');
exports.saveTour = (tour) => tour.save();
