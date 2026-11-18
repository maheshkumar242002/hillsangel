import { Op } from 'sequelize';

/**
 * BaseRepository
 * Generic Data Access Layer (DAL) implementing standard Sequelize DB operations.
 * Isolates database queries and ORM mechanics from application business logic.
 *
 * FULL SOFT-DELETE & HARD-DELETE SUPPORT:
 * - Operates using the `isDelete` boolean flag and `deletedAt` timestamp.
 * - By default, query methods automatically exclude soft-deleted records (`isDelete: false`).
 * - Supports `includeDeleted: true` (or `withDeleted: true`) to query active + deleted records.
 * - Supports `onlyDeleted: true` to query only soft-deleted records (Trash / Recycle Bin).
 * - Supports `hardDelete(id)` for permanent physical DB deletion.
 * - Supports `softDelete(id)` for non-destructive logical deletion.
 * - Supports `restore(id)` to un-delete a soft-deleted record.
 */
export class BaseRepository {
  /**
   * @param {import('sequelize').ModelStatic<any>} model Sequelize Model
   */
  constructor(model) {
    if (!model) {
      throw new Error('BaseRepository requires a valid Sequelize model.');
    }
    this.model = model;
  }

  /**
   * Helper to check whether the underlying model supports soft delete via `isDelete`
   */
  hasSoftDelete() {
    return Boolean(this.model.rawAttributes && this.model.rawAttributes.isDelete);
  }

  /**
   * Scopes `where` conditions based on soft-delete options
   * @param {object} where
   * @param {object} options
   */
  applySoftDeleteScope(where = {}, options = {}) {
    if (!this.hasSoftDelete()) {
      return { ...where };
    }

    // Explicitly requested only deleted records (e.g. Trash bin)
    if (options.onlyDeleted) {
      return {
        ...where,
        isDelete: true,
      };
    }

    // Explicitly include deleted records
    if (options.includeDeleted || options.withDeleted) {
      return { ...where };
    }

    // Default: Return only active, non-deleted records
    return {
      ...where,
      isDelete: false,
    };
  }

  /**
   * Create a new record (ensures isDelete defaults to false)
   * @param {object} data
   * @param {object} [options]
   */
  async create(data, options = {}) {
    const payload = this.hasSoftDelete() ? { isDelete: false, deletedAt: null, ...data } : data;
    return this.model.create(payload, options);
  }

  /**
   * Create multiple records in bulk
   * @param {Array<object>} records
   * @param {object} [options]
   */
  async bulkCreate(records, options = {}) {
    const payload = this.hasSoftDelete()
      ? records.map((r) => ({ isDelete: false, deletedAt: null, ...r }))
      : records;
    return this.model.bulkCreate(payload, options);
  }

  /**
   * Find a single record by primary key (excludes soft-deleted by default)
   * @param {string|number} id
   * @param {object} [options]
   */
  async findById(id, options = {}) {
    const primaryKeyField = this.model.primaryKeyAttribute || 'id';
    const where = this.applySoftDeleteScope({ [primaryKeyField]: id }, options);
    return this.model.findOne({ where, ...options });
  }

  /**
   * Find first record matching query criteria
   * @param {object} where
   * @param {object} [options]
   */
  async findOne(where = {}, options = {}) {
    const scopedWhere = this.applySoftDeleteScope(where, options);
    return this.model.findOne({ where: scopedWhere, ...options });
  }

  /**
   * Find all records matching query options (excludes soft-deleted by default)
   * @param {object} [options]
   */
  async findAll(options = {}) {
    const scopedWhere = this.applySoftDeleteScope(options.where || {}, options);
    return this.model.findAll({ ...options, where: scopedWhere });
  }

  /**
   * Find and count all records (useful for pagination)
   * @param {object} [options]
   */
  async findAndCountAll(options = {}) {
    const scopedWhere = this.applySoftDeleteScope(options.where || {}, options);
    return this.model.findAndCountAll({ ...options, where: scopedWhere });
  }

  /**
   * Paginated search helper
   * @param {object} params
   */
  async paginate({
    page = 1,
    limit = 10,
    where = {},
    order = [['createdAt', 'DESC']],
    include = [],
    attributes,
    includeDeleted = false,
    onlyDeleted = false,
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const scopedWhere = this.applySoftDeleteScope(where, { includeDeleted, onlyDeleted });

    const queryOptions = {
      where: scopedWhere,
      limit: limitNum,
      offset,
      order,
      include,
      distinct: true,
    };

    if (attributes) {
      queryOptions.attributes = attributes;
    }

    const { count, rows } = await this.model.findAndCountAll(queryOptions);

    return {
      records: rows,
      totalRecords: count,
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum) || 1,
      limit: limitNum,
      hasNext: pageNum * limitNum < count,
      hasPrev: pageNum > 1,
    };
  }

  /**
   * Update a record by primary key
   * @param {string|number} id
   * @param {object} data
   * @param {object} [options]
   */
  async update(id, data, options = {}) {
    const record = await this.findById(id, options);
    if (!record) return null;
    return record.update(data, options);
  }

  /**
   * Update records matching criteria
   * @param {object} data
   * @param {object} where
   * @param {object} [options]
   */
  async updateWhere(data, where, options = {}) {
    const scopedWhere = this.applySoftDeleteScope(where, options);
    const [affectedCount] = await this.model.update(data, { where: scopedWhere, ...options });
    return affectedCount;
  }

  /**
   * Soft delete a record by setting `isDelete: true` and `deletedAt: new Date()`
   * @param {string|number} id
   * @param {object} [options]
   */
  async softDelete(id, options = {}) {
    // Find record regardless of current soft-delete status
    const record = await this.findById(id, { ...options, includeDeleted: true });
    if (!record) return null;

    if (this.hasSoftDelete()) {
      await record.update(
        {
          isDelete: true,
          deletedAt: new Date(),
        },
        options
      );
      return record;
    }

    // Fallback to hard delete if model has no soft-delete column
    await record.destroy(options);
    return record;
  }

  /**
   * Hard delete a record permanently from the database table
   * @param {string|number} id
   * @param {object} [options]
   */
  async hardDelete(id, options = {}) {
    const record = await this.findById(id, { ...options, includeDeleted: true });
    if (!record) return false;
    await record.destroy(options);
    return true;
  }

  /**
   * Restore a previously soft-deleted record (`isDelete: false`, `deletedAt: null`)
   * @param {string|number} id
   * @param {object} [options]
   */
  async restore(id, options = {}) {
    const record = await this.findById(id, { ...options, onlyDeleted: true });
    if (!record) return null;

    if (this.hasSoftDelete()) {
      await record.update(
        {
          isDelete: false,
          deletedAt: null,
        },
        options
      );
      return record;
    }
    return record;
  }

  /**
   * Unified delete method:
   * - If `options.hard === true` -> performs hardDelete
   * - Otherwise -> performs softDelete (default)
   * @param {string|number} id
   * @param {object} [options]
   * @param {boolean} [options.hard=false]
   */
  async delete(id, { hard = false, ...options } = {}) {
    if (hard) {
      return this.hardDelete(id, options);
    }
    return this.softDelete(id, options);
  }

  /**
   * Count total active records (excludes soft-deleted by default)
   * @param {object} [where={}]
   * @param {object} [options={}]
   */
  async count(where = {}, options = {}) {
    const scopedWhere = this.applySoftDeleteScope(where, options);
    return this.model.count({ where: scopedWhere, ...options });
  }

  /**
   * Check if at least one matching record exists
   * @param {object} where
   * @param {object} [options]
   */
  async exists(where = {}, options = {}) {
    const scopedWhere = this.applySoftDeleteScope(where, options);
    const count = await this.model.count({ where: scopedWhere, limit: 1, ...options });
    return count > 0;
  }
}

export default BaseRepository;
