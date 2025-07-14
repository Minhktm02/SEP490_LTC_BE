const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const adminController = require('../controllers/adminController');

// Mock các service
jest.mock('../services/adminService', () => ({
  getPendingBusinessUsersService: jest.fn(),
  verifyBusinessUserService: jest.fn(),
  checkTaxCodeService: jest.fn()
}));

const {
  getPendingBusinessUsersService,
  verifyBusinessUserService,
  checkTaxCodeService
} = require('../services/adminService');

const app = express();
app.use(bodyParser.json());
app.get('/admin/pending-users', adminController.getPendingBusinessUsers);
app.post('/admin/verify-user', adminController.verifyBusinessUser);
app.get('/admin/check-tax', adminController.checkTaxCode);

describe('Admin Controller', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getPendingBusinessUsers - success', async () => {
    getPendingBusinessUsersService.mockResolvedValue([{ name: 'Test Company' }]);

    const res = await request(app).get('/admin/pending-users');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ name: 'Test Company' }]);
  });

  test('verifyBusinessUser - success', async () => {
    verifyBusinessUserService.mockResolvedValue({ success: true });

    const res = await request(app)
      .post('/admin/verify-user')
      .send({ userId: 'abc123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  test('checkTaxCode - missing taxCode', async () => {
    const res = await request(app).get('/admin/check-tax');

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Vui lòng cung cấp mã số thuế' });
  });

  test('checkTaxCode - success', async () => {
    checkTaxCodeService.mockResolvedValue({ success: true, name: 'Công ty A' });

    const res = await request(app).get('/admin/check-tax?taxCode=123456');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, name: 'Công ty A' });
  });

  test('checkTaxCode - tax code not found', async () => {
    checkTaxCodeService.mockResolvedValue({ success: false, message: 'Không tìm thấy' });

    const res = await request(app).get('/admin/check-tax?taxCode=999');

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Không tìm thấy' });
  });

});
