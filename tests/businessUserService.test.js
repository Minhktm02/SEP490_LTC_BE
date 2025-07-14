const bcrypt = require('bcryptjs');
const { registerBusinessUserService } = require('../services/businessUserService');

jest.mock('../repositories/authRepository');
jest.mock('../config/cloudinary');
jest.mock('bcryptjs');

const UserRepository = require('../repositories/authRepository');
const cloudinary = require('../config/cloudinary');

describe('registerBusinessUserService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('register success with image upload', async () => {
    UserRepository.findUserByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedpassword');

    const fileBuffer = Buffer.from('dummy file');
    const file = { buffer: fileBuffer };

    cloudinary.uploader = {
      upload_stream: (_, callback) => {
        return {
          end: () => callback(null, { secure_url: 'http://cloudinary.com/image.jpg' }),
        };
      },
    };

    const result = await registerBusinessUserService(
      {
        email: 'user@example.com',
        password: 'pass',
        name: 'User',
        role: 'hotel_owner',
        phone: '0123456789',
      },
      file
    );

    expect(result.success).toBe(true);
    expect(UserRepository.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'user@example.com',
      password: 'hashedpassword',
      businessLicenseImage: 'http://cloudinary.com/image.jpg',
    }));
  });

  test('register fails if email already exists', async () => {
    UserRepository.findUserByEmail.mockResolvedValue({ _id: '123' });

    await expect(
      registerBusinessUserService(
        { email: 'user@example.com', role: 'hotel_owner' },
        null
      )
    ).rejects.toThrow('Email đã được sử dụng');
  });

  test('register fails with invalid role', async () => {
    UserRepository.findUserByEmail.mockResolvedValue(null);

    await expect(
      registerBusinessUserService(
        { email: 'user@example.com', role: 'invalid_role' },
        null
      )
    ).rejects.toThrow('Vai trò không hợp lệ');
  });

  test('register fails if missing taxId and file', async () => {
    UserRepository.findUserByEmail.mockResolvedValue(null);

    await expect(
      registerBusinessUserService(
        { email: 'user@example.com', role: 'hotel_owner' },
        null
      )
    ).rejects.toThrow('Phải cung cấp mã số thuế hoặc hình ảnh giấy phép kinh doanh');
  });

  test('register fails on cloudinary upload error', async () => {
    UserRepository.findUserByEmail.mockResolvedValue(null);

    cloudinary.uploader = {
      upload_stream: (_, callback) => {
        return {
          end: () => callback(new Error('upload failed'), null),
        };
      },
    };

    await expect(
      registerBusinessUserService(
        {
          email: 'user@example.com',
          role: 'hotel_owner',
          password: '123456',
          name: 'User',
          phone: '0123456789',
        },
        { buffer: Buffer.from('file') }
      )
    ).rejects.toThrow('Lỗi khi tải lên hình ảnh giấy phép kinh doanh');
  });
});
