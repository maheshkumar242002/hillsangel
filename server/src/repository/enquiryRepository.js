import { BaseRepository } from './BaseRepository.js';
import Enquiry from '../models/Enquiry.js';

export class EnquiryRepository extends BaseRepository {
  constructor() {
    super(Enquiry);
  }

  /**
   * Find enquiries with status filtering and pagination
   */
  async findEnquiriesFiltered({ status, page = 1, limit = 20 } = {}) {
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const { rows: enquiries, count: total } = await this.model.findAndCountAll({
      where: this.applySoftDeleteScope(where),
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: limitNum,
    });

    return {
      enquiries,
      count: enquiries.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
    };
  }
}

export default new EnquiryRepository();
