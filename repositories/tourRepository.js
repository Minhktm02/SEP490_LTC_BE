const Tour = require('../models/Tour');

exports.create = (data) => new Tour(data).save();

exports.findAll = () => Tour.find();

exports.search = (filter) => Tour.find(filter);

exports.findById = (id) => Tour.findById(id);

exports.updateById = (id, updates) => Tour.findByIdAndUpdate(id, updates, { new: true });

exports.softDeleteById = async (id) => {
  const tour = await Tour.findById(id);
  if (!tour) return null;
  tour.status = 'inactive';
  return tour.save();
};
