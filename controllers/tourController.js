const tourService = require('../services/tourService');

exports.createTour = async (req, res) => {
  try {
    const tour = await tourService.createTour(req.body);
    res.status(201).json(tour);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllTours = async (req, res) => {
  try {
    const tours = await tourService.getAllTours();
    res.json(tours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.searchTours = async (req, res) => {
  try {
    const tours = await tourService.searchTours(req.query);
    res.json(tours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getTourById = async (req, res) => {
  try {
    const tour = await tourService.getTourById(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });
    res.json(tour);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await tourService.updateTour(req.params.id, req.body);
    if (!tour) return res.status(404).json({ message: "Tour not found" });
    res.json(tour);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const result = await tourService.deleteTour(req.params.id);
    if (!result) return res.status(404).json({ message: "Tour not found" });
    res.json({ message: "Tour deactivated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
