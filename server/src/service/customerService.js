import { BaseService } from './BaseService.js';
import customerRepository from '../repository/customerRepository.js';
import { CustomerStatus } from '../enums/index.js';

export class CustomerService extends BaseService {
  constructor() {
    super(customerRepository);
  }

  /**
   * Filtered customers with pagination
   */
  async getCustomers(filters) {
    return customerRepository.findCustomersFiltered(filters);
  }

  /**
   * Create customer with duplicate phone number validation
   */
  async createCustomer(payload) {
    const cleanPhone = payload.phone?.trim();
    const existing = await customerRepository.findByPhone(cleanPhone);
    if (existing) {
      const err = new Error(`Customer with phone number '${cleanPhone}' already exists.`);
      err.statusCode = 409;
      throw err;
    }

    const customerData = {
      name: payload.name.trim(),
      phone: cleanPhone,
      email: payload.email ? payload.email.trim() : null,
      city: payload.city ? payload.city.trim() : null,
      address: payload.address ? payload.address.trim() : null,
      notes: payload.notes ? payload.notes.trim() : null,
      status: payload.status || CustomerStatus.ACTIVE,
      totalBookings: Number(payload.totalBookings) || 0,
      totalSpent: Number(payload.totalSpent) || 0,
    };

    return customerRepository.create(customerData);
  }

  /**
   * Get customer with linked bookings
   */
  async getCustomerWithBookings(id) {
    const result = await customerRepository.findCustomerWithLinkedBookings(id);
    if (!result) {
      const err = new Error('Customer not found.');
      err.statusCode = 404;
      throw err;
    }
    return result;
  }

  /**
   * Update customer profile
   */
  async updateCustomer(id, payload) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      const err = new Error('Customer not found.');
      err.statusCode = 404;
      throw err;
    }

    await customer.update(payload);
    return customer;
  }
}

export default new CustomerService();
