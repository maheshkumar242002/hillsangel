import { BaseService } from './BaseService.js';
import packageRepository from '../repository/packageRepository.js';
import uploadService from './uploadService.js';
import { PackageStatus } from '../enums/index.js';

const DESTINATION_IMAGE_MAP = {
  Kanthaloor: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80',
  Munnar: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=800&q=80',
  Vagamon: 'https://images.unsplash.com/photo-1609852614170-988be080447a?auto=format&fit=crop&w=800&q=80',
  Kolukkumalai: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  Ooty: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
  Kodaikanal: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
  Valparai: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=800&q=80',
  Wayanad: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
};

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

export class PackageService extends BaseService {
  constructor() {
    super(packageRepository);
  }

  /**
   * Filter packages with full asset and partner details
   */
  async getFilteredPackages(filters) {
    return packageRepository.findPackagesWithFilters(filters);
  }

  /**
   * Get single package by ID
   */
  async getPackageById(id) {
    const pkg = await packageRepository.findWithDetails(id);
    if (!pkg) {
      const err = new Error('Package not found.');
      err.statusCode = 404;
      throw err;
    }
    return pkg;
  }

  /**
   * Get package by URL slug
   */
  async getPackageBySlug(slug) {
    const pkg = await packageRepository.findBySlug(slug);
    if (!pkg) {
      const err = new Error('Package not found.');
      err.statusCode = 404;
      throw err;
    }
    return pkg;
  }

  /**
   * Get featured packages for homepage
   */
  async getFeaturedPackages(limit) {
    return packageRepository.findFeatured(limit);
  }

  /**
   * Get distinct destination summaries
   */
  async getDestinations() {
    const records = await packageRepository.findDistinctDestinations();
    const destinations = records.map((p) => {
      const dest = p.destination;
      const count = 1;
      const image = DESTINATION_IMAGE_MAP[dest] ||
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
      return { destination: dest, count, image };
    });
    return destinations;
  }

  /**
   * Create new tour package
   */
  async createPackage(payload) {
    const slug = generateSlug(payload.title);

    const existingSlug = await packageRepository.findOne({ slug });
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const packageData = {
      ...payload,
      slug: finalSlug,
      price: parseFloat(payload.price),
      originalPrice: payload.originalPrice ? parseFloat(payload.originalPrice) : null,
      status: payload.status || PackageStatus.ACTIVE,
    };

    const newPkg = await packageRepository.create(packageData);
    return packageRepository.findWithDetails(newPkg.id);
  }

  /**
   * Update tour package
   */
  async updatePackage(id, payload) {
    const pkg = await packageRepository.findById(id);
    if (!pkg) {
      const err = new Error('Package not found.');
      err.statusCode = 404;
      throw err;
    }

    const updatePayload = { ...payload };
    if (updatePayload.title && updatePayload.title !== pkg.title) {
      updatePayload.slug = generateSlug(updatePayload.title);
    }
    if (updatePayload.price !== undefined) {
      updatePayload.price = parseFloat(updatePayload.price);
    }
    if (updatePayload.originalPrice !== undefined) {
      updatePayload.originalPrice = updatePayload.originalPrice ? parseFloat(updatePayload.originalPrice) : null;
    }

    await pkg.update(updatePayload);
    return packageRepository.findWithDetails(id);
  }

  /**
   * Toggle package active / inactive status
   */
  async togglePackageStatus(id) {
    const pkg = await packageRepository.findById(id);
    if (!pkg) {
      const err = new Error('Package not found.');
      err.statusCode = 404;
      throw err;
    }

    const newStatus = pkg.status === PackageStatus.ACTIVE ? PackageStatus.INACTIVE : PackageStatus.ACTIVE;
    await pkg.update({ status: newStatus });
    return pkg;
  }

  /**
   * Upload package images
   */
  async uploadPackageImages(files, req) {
    const results = await uploadService.processMultipleFiles(files, req);
    return results.map((r) => r.url);
  }
}

export default new PackageService();
