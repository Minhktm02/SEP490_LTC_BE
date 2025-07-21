const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const {
  getPendingBusinessUsersService,
  verifyBusinessUserService,
  checkTaxCodeService,
} = require('../services/adminService');

jest.mock('../repositories/authRepository');

const UserRepository = require('../repositories/authRepository');

describe('Admin Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getPendingBusinessUsersService - success', async () => {
    const mockUsers = [{ email: 'test@example.com' }];
    UserRepository.findPendingBusinessUsers.mockResolvedValue(mockUsers);

    const result = await getPendingBusinessUsersService();

    expect(result).toEqual({ success: true, data: mockUsers });
    expect(UserRepository.findPendingBusinessUsers).toHaveBeenCalled();
  });

  test('verifyBusinessUserService - approve success', async () => {
    const mockUser = {
      _id: '123',
      role: 'hotel_owner',
      isBusinessVerified: false,
      status: 'pending',
    };

    UserRepository.findUserById.mockResolvedValue(mockUser);
    UserRepository.updateUser.mockResolvedValue();

    const result = await verifyBusinessUserService({
      userId: '123',
      approve: true,
    });

    expect(result).toEqual({ success: true, message: 'Tài khoản đã được kích hoạt' });
    expect(mockUser.isBusinessVerified).toBe(true);
    expect(mockUser.status).toBe('active');
    expect(UserRepository.updateUser).toHaveBeenCalledWith(expect.objectContaining({
      status: 'active',
      isBusinessVerified: true,
    }));
  });

  test('verifyBusinessUserService - reject user', async () => {
    const mockUser = {
      _id: '123',
      role: 'tour_provider',
      isBusinessVerified: false,
      status: 'pending',
    };

    UserRepository.findUserById.mockResolvedValue(mockUser);
    UserRepository.updateUser.mockResolvedValue();

    const result = await verifyBusinessUserService({
      userId: '123',
      approve: false,
    });

    expect(result).toEqual({ success: true, message: 'Tài khoản đã bị từ chối' });
    expect(mockUser.status).toBe('banned');
  });

  test('verifyBusinessUserService - user not found or invalid role', async () => {
    UserRepository.findUserById.mockResolvedValue(null);

    await expect(
      verifyBusinessUserService({ userId: '999', approve: true })
    ).rejects.toThrow('Người dùng không tồn tại hoặc không phải tài khoản kinh doanh');
  });

  test('checkTaxCodeService - success from API', async () => {
    const mock = new MockAdapter(axios);
    const taxCode = '123456789';
    const apiData = { success: true, data: { name: 'Test Company' } };

    mock.onGet(`https://mst-thue.vercel.app/api/mst/${taxCode}`).reply(200, apiData);

    const result = await checkTaxCodeService(taxCode);
    expect(result).toEqual({ success: true, data: apiData.data });
  });

  test('checkTaxCodeService - not found', async () => {
    const mock = new MockAdapter(axios);
    const taxCode = 'invalid';
    const apiData = { success: false };

    mock.onGet(`https://mst-thue.vercel.app/api/mst/${taxCode}`).reply(200, apiData);

    const result = await checkTaxCodeService(taxCode);
    expect(result).toEqual({ success: false, message: 'Mã số thuế không hợp lệ hoặc không tìm thấy' });
  });

  test('checkTaxCodeService - axios throws error', async () => {
    const mock = new MockAdapter(axios);
    const taxCode = 'error';
    mock.onGet(`https://mst-thue.vercel.app/api/mst/${taxCode}`).networkError();

    const result = await checkTaxCodeService(taxCode);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Lỗi khi kiểm tra mã số thuế:/);
  });
});
