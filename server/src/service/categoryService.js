import { BaseService } from './BaseService.js';
import categoryRepository from '../repository/categoryRepository.js';

export class CategoryService extends BaseService {
  constructor() {
    super(categoryRepository);
  }

  async getByKey(key) {
    const category = await categoryRepository.findByKey(key);
    if (!category) {
      const err = new Error(`Category '${key}' not found`);
      err.statusCode = 404;
      throw err;
    }
    return category;
  }
}

export default new CategoryService();
