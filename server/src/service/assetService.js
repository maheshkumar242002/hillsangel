import { BaseService } from './BaseService.js';
import assetRepository from '../repository/assetRepository.js';
import uploadService from './uploadService.js';
import { AssetStatus, AssetCategory } from '../enums/index.js';

export class AssetService extends BaseService {
  constructor() {
    super(assetRepository);
  }

  /**
   * Filtered assets
   */
  async getAssets(filters) {
    return assetRepository.findAssetsFiltered(filters);
  }

  /**
   * Asset metrics and statistics
   */
  async getStats() {
    return assetRepository.getAssetStatistics();
  }

  /**
   * Create asset with unique assetCode generation & collision check
   */
  async createAsset(payload) {
    const code =
      payload.assetCode?.trim().toUpperCase() ||
      `AST-${(payload.category || 'GEN').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const existing = await assetRepository.findByCode(code);
    if (existing) {
      const err = new Error(`Asset code '${code}' already exists. Please use a unique code.`);
      err.statusCode = 409;
      throw err;
    }

    const assetData = {
      name: payload.name.trim(),
      assetCode: code,
      category: payload.category || AssetCategory.CAMPING,
      buyPrice: Number(payload.buyPrice) || 0,
      rentPrice: Number(payload.rentPrice) || 0,
      rentUnit: payload.rentUnit || 'per trip',
      quantity: Number(payload.quantity) || 1,
      availableQuantity:
        payload.availableQuantity !== undefined
          ? Number(payload.availableQuantity)
          : Number(payload.quantity) || 1,
      status: payload.status || AssetStatus.AVAILABLE,
      imageUrl: payload.imageUrl || '',
      description: payload.description || '',
      vehicleSpecs: payload.vehicleSpecs || null,
    };

    return assetRepository.create(assetData);
  }

  /**
   * Update asset with code collision check
   */
  async updateAsset(id, payload) {
    const asset = await assetRepository.findById(id);
    if (!asset) {
      const err = new Error('Asset not found');
      err.statusCode = 404;
      throw err;
    }

    if (payload.assetCode && payload.assetCode.toUpperCase() !== asset.assetCode) {
      const code = payload.assetCode.toUpperCase().trim();
      const conflict = await assetRepository.findByCode(code, asset.id);
      if (conflict) {
        const err = new Error(`Asset code '${code}' already in use by another asset`);
        err.statusCode = 409;
        throw err;
      }
      payload.assetCode = code;
    }

    await asset.update(payload);
    return asset;
  }

  /**
   * Upload asset image
   */
  async uploadImage(file, req) {
    const result = await uploadService.processFile(file, req);
    return result.url;
  }
}

export default new AssetService();
