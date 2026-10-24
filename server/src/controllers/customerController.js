import { Op } from 'sequelize';
import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';

// @desc    Get all customers with pagination & search (Admin)
// @route   GET /api/customers
// @access  Private (Admin)
export const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, sort = 'newest' } = req.query;

    const where = {};
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: term } },
        { phone: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { city: { [Op.like]: term } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    let order = [['createdAt', 'DESC']];
    if (sort === 'oldest') order = [['createdAt', 'ASC']];
    else if (sort === 'bookings') order = [['totalBookings', 'DESC']];
    else if (sort === 'spent') order = [['totalSpent', 'DESC']];

    const { rows: customers, count: total } = await Customer.findAndCountAll({
      where,
      order,
      offset: skip,
      limit: limitNum,
    });

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      customers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create / Insert a customer record (Admin)
// @route   POST /api/customers
// @access  Private (Admin)
export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, city, address, notes, status, totalBookings, totalSpent } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone number are required.',
      });
    }

    const existing = await Customer.findOne({ where: { phone: phone.trim() } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Customer with phone number '${phone.trim()}' already exists.`,
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      city: city ? city.trim() : null,
      address: address ? address.trim() : null,
      notes: notes ? notes.trim() : null,
      status: status || 'active',
      totalBookings: Number(totalBookings) || 0,
      totalSpent: Number(totalSpent) || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Customer inserted successfully.',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer details with linked bookings (Admin)
// @route   GET /api/customers/:id
// @access  Private (Admin)
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const bookings = await Booking.findAll({
      where: {
        [Op.or]: [{ customerId: customer.id }, { phone: customer.phone }],
      },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      customer,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer details or notes (Admin)
// @route   PUT /api/customers/:id
// @access  Private (Admin)
export const updateCustomer = async (req, res, next) => {
  try {
    const { name, email, city, address, notes, status } = req.body;

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    await customer.update({ name, email, city, address, notes, status });

    res.status(200).json({
      success: true,
      message: 'Customer profile updated.',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer record (Admin)
// @route   DELETE /api/customers/:id
// @access  Private (Admin)
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    await customer.destroy();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
