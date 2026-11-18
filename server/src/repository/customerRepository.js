import { Op } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';

export class CustomerRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }

  /**
   * Find customers with search, sort, and pagination
   */
  async findCustomersFiltered({ search, page = 1, limit = 20, sort = 'newest' } = {}) {
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

    const { rows: customers, count: total } = await this.model.findAndCountAll({
      where: this.applySoftDeleteScope(where),
      order,
      offset: skip,
      limit: limitNum,
    });

    return {
      customers,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
    };
  }

  /**
   * Find customer by phone number
   */
  async findByPhone(phone, excludeId = null) {
    const where = { phone };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return this.findOne(where);
  }

  /**
   * Find customer and their bookings linked by customerId or phone
   */
  async findCustomerWithLinkedBookings(id) {
    const customer = await this.findById(id);
    if (!customer) return null;

    const bookings = await Booking.findAll({
      where: {
        [Op.or]: [{ customerId: customer.id }, { phone: customer.phone }],
      },
      order: [['createdAt', 'DESC']],
    });

    return {
      customer,
      bookings,
    };
  }

  /**
   * Find or create customer
   */
  async findOrCreateCustomer({ phone, email, name, address }) {
    let customer = null;
    if (phone) customer = await this.findOne({ phone });
    if (!customer && email) customer = await this.findOne({ email });

    if (!customer) {
      customer = await this.create({
        name,
        phone,
        email,
        address,
      });
    }

    return customer;
  }
}

export default new CustomerRepository();
