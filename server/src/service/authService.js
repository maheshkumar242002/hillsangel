import jwt from 'jsonwebtoken';
import { BaseService } from './BaseService.js';
import adminRepository from '../repository/adminRepository.js';

export class AuthService extends BaseService {
  constructor() {
    super(adminRepository);
  }

  generateToken(id) {
    return jwt.sign(
      { id },
      process.env.JWT_SECRET || 'hills_angels_super_secret_jwt_key_2026_elaichi',
      { expiresIn: '7d' }
    );
  }

  /**
   * Admin authentication business workflow
   */
  async login({ email, password }) {
    const cleanEmail = email.toLowerCase().trim();
    const admin = await adminRepository.findByEmail(cleanEmail);

    if (!admin) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = this.generateToken(admin.id);

    return {
      token,
      admin: {
        id: admin.id,
        _id: String(admin.id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    };
  }

  /**
   * Get authenticated profile
   */
  async getMe(id) {
    const admin = await adminRepository.findById(id, {
      attributes: { exclude: ['password'] },
    });
    if (!admin) {
      const err = new Error('Admin profile not found.');
      err.statusCode = 404;
      throw err;
    }
    return admin;
  }
}

export default new AuthService();
