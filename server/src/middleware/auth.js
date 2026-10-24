import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const protectAdmin = async (req, res, next) => {
  let token = null;

  // 1. Check httpOnly cookie
  if (req.cookies && req.cookies.adminToken) {
    token = req.cookies.adminToken;
  }
  // 2. Check Authorization Bearer header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in as an administrator.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hills_angels_jwt_secret');
    const admin = await Admin.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Admin account not found.',
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token has expired or is invalid. Please log in again.',
    });
  }
};
