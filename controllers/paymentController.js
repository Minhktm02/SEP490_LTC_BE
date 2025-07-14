const paymentService = require('../services/paymentService.js');

const handlePayOSWebhook = async (req, res) => {
  try {
    const { data, signature } = req.body;

    if (!data || !signature) {
      return res.status(400).json({ success: false, message: 'Thiếu dữ liệu hoặc chữ ký.' });
    }

    const result = await paymentService.handlePayOSWebhook(data, signature);
    return res.status(200).json({ success: true, message: 'Webhook xử lý thành công.' });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { handlePayOSWebhook };