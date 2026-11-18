import { Op } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import Gallery from '../models/Gallery.js';

export class GalleryRepository extends BaseRepository {
  constructor() {
    super(Gallery);
  }

  /**
   * Find gallery items with type, tag, and featured filtering
   */
  async findGalleryFiltered({ type, tag, featured } = {}) {
    const where = {};

    if (type && ['photo', 'video'].includes(type)) {
      where.type = type;
    }
    if (tag && tag !== 'all') {
      where.tag = { [Op.like]: tag };
    }
    if (featured === 'true' || featured === true) {
      where.featured = true;
    }

    return this.findAll({
      where: this.applySoftDeleteScope(where),
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  }
}

export default new GalleryRepository();
