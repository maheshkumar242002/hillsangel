/**
 * BaseService
 * Provides standardized business logic operations wrapping a BaseRepository.
 * Handles domain validation, transactional flows, soft delete, hard delete, and restore workflows.
 */
export class BaseService {
  /**
   * @param {import('../repository/BaseRepository.js').BaseRepository} repository
   */
  constructor(repository) {
    if (!repository) {
      throw new Error('BaseService requires a valid repository instance.');
    }
    this.repository = repository;
  }

  /**
   * Business validation hook - override in child services
   * @param {object} data
   * @param {boolean} isUpdate
   */
  async validate(data, isUpdate = false) {
    return true;
  }

  /**
   * Retrieve all active records (excludes soft-deleted by default)
   */
  async getAll(options = {}) {
    return this.repository.findAll(options);
  }

  /**
   * Retrieve single record by ID with validation
   */
  async getById(id, options = {}) {
    const record = await this.repository.findById(id, options);
    if (!record) {
      const error = new Error(`Resource with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    return record;
  }

  /**
   * Create new entity with business validation
   */
  async create(data, options = {}) {
    await this.validate(data, false);
    return this.repository.create(data, options);
  }

  /**
   * Update entity by ID with business validation
   */
  async update(id, data, options = {}) {
    await this.getById(id, options);
    await this.validate(data, true);
    return this.repository.update(id, data, options);
  }

  /**
   * Delete entity:
   * - If `hard: true` -> permanently deletes from database table (hard delete)
   * - If `hard: false` (default) -> sets `isDelete: true` and `deletedAt: new Date()` (soft delete)
   * @param {string|number} id
   * @param {object} [options]
   * @param {boolean} [options.hard=false]
   */
  async delete(id, { hard = false, ...options } = {}) {
    const record = await this.repository.findById(id, { includeDeleted: true });
    if (!record) {
      const error = new Error(`Resource with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (hard) {
      await this.repository.hardDelete(id, options);
      return { id, isDelete: true, hardDeleted: true };
    }

    const softDeleted = await this.repository.softDelete(id, options);
    return softDeleted;
  }

  /**
   * Soft delete convenience method
   */
  async softDelete(id, options = {}) {
    return this.delete(id, { ...options, hard: false });
  }

  /**
   * Hard delete convenience method
   */
  async hardDelete(id, options = {}) {
    return this.delete(id, { ...options, hard: true });
  }

  /**
   * Restore a soft-deleted entity (`isDelete: false`, `deletedAt: null`)
   */
  async restore(id, options = {}) {
    const record = await this.repository.findById(id, { onlyDeleted: true });
    if (!record) {
      const error = new Error(`Soft-deleted resource with ID ${id} not found in trash.`);
      error.statusCode = 404;
      throw error;
    }

    return this.repository.restore(id, options);
  }

  /**
   * Retrieve soft-deleted records (Trash / Recycle Bin view)
   */
  async getTrash(paginationOptions = {}) {
    return this.repository.paginate({
      ...paginationOptions,
      onlyDeleted: true,
    });
  }

  /**
   * Retrieve paginated active records
   */
  async getPaginated(paginationOptions) {
    return this.repository.paginate(paginationOptions);
  }
}

export default BaseService;
