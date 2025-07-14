const { Payment } = require('@payos/node');
require('dotenv').config();

const payos = new Payment({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.API_KEY,
  checksumKey: process.env.CHECKSUM_KEY
});

module.exports = payos;
