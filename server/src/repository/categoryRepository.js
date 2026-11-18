import { BaseRepository } from './BaseRepository.js';
import Category from '../models/Category.js';

export class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  async findByKey(key) {
    return this.findOne({ key });
  }

  async findBySlug(slug) {
    return this.findOne({ slug });
  }
}

export default new CategoryRepository();
