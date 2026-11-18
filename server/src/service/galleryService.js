import { BaseService } from './BaseService.js';
import galleryRepository from '../repository/galleryRepository.js';
import uploadService from './uploadService.js';
import { MediaType } from '../enums/index.js';

export class GalleryService extends BaseService {
  constructor() {
    super(galleryRepository);
  }

  /**
   * Filtered gallery items
   */
  async getGalleryItems(filters) {
    return galleryRepository.findGalleryFiltered(filters);
  }

  /**
   * Create gallery item
   */
  async createGalleryItem(payload) {
    const isPhoto = (payload.type || MediaType.PHOTO) === MediaType.PHOTO;
    const item = await galleryRepository.create({
      title: payload.title.trim(),
      type: payload.type || MediaType.PHOTO,
      url: payload.url.trim(),
      thumbnailUrl: payload.thumbnailUrl || (isPhoto ? payload.url.trim() : null),
      tag: payload.tag || 'Hill Station',
      caption: payload.caption || '',
      featured: Boolean(payload.featured),
      sortOrder: Number(payload.sortOrder) || 0,
    });
    return item;
  }

  /**
   * Update gallery item
   */
  async updateGalleryItem(id, payload) {
    const item = await galleryRepository.findById(id);
    if (!item) {
      const err = new Error('Gallery item not found');
      err.statusCode = 404;
      throw err;
    }
    await item.update(payload);
    return item;
  }

  /**
   * Upload media file (photo or video)
   */
  async uploadMedia(file, req) {
    const result = await uploadService.processFile(file, req);
    const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.originalname);
    return {
      fileUrl: result.url,
      type: isVideo ? MediaType.VIDEO : MediaType.PHOTO,
      originalName: file.originalname,
    };
  }
}

export default new GalleryService();
