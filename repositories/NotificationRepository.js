const Notification = require('../models/Notification');

class NotificationRepository {
  async create(notificationData, session) {
    return await Notification.create([notificationData], { session });
  }

  async find(query, session) {
    return await Notification.find(query).session(session);
  }

  async findById(notificationId, session) {
    return await Notification.findById(notificationId).session(session);
  }
}

module.exports = new NotificationRepository();