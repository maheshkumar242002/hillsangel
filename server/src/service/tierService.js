import { BaseService } from './BaseService.js';
import tierRepository from '../repository/tierRepository.js';

export class TierService extends BaseService {
  constructor() {
    super(tierRepository);
  }

  async getByKey(key) {
    const tier = await tierRepository.findByKey(key);
    if (!tier) {
      const err = new Error(`Tier '${key}' not found`);
      err.statusCode = 404;
      throw err;
    }
    return tier;
  }
}

export default new TierService();
