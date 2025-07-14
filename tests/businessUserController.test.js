const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { registerBusinessUser } = require('../controllers/businessUserController');

// Mock service
jest.mock('../services/businessUserService', () => ({
  registerBusinessUserService: jest.fn()
}));

const { registerBusinessUserService } = require('../services/businessUserService');

const app = express();
const upload = multer().single('file');

app.use(bodyParser.json());
app.post('/business/register', upload, registerBusinessUser);

describe('Business User Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('registerBusinessUser - success', async () => {
    registerBusinessUserService.mockResolvedValue({ success: true });

    const res = await request(app)
      .post('/business/register')
      .field('companyName', 'Test Corp')
      .attach('file', Buffer.from('dummy file'), 'test.pdf');

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ success: true });
  });
});
