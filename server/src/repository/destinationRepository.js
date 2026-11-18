import { Op, Sequelize } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import Destination from '../models/Destination.js';
import PartnerTieup from '../models/PartnerTieup.js';
import Package from '../models/Package.js';

export class DestinationRepository extends BaseRepository {
  constructor() {
    super(Destination);
  }

  /**
   * Find destinations with aggregated partner & package counts
   */
  async findDestinationsWithStats({ search, state, status, sort = 'sortOrder' } = {}) {
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (state && state !== 'all') where.state = state;

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: term } },
        { state: { [Op.like]: term } },
        { tagline: { [Op.like]: term } },
      ];
    }

    let order = [['sortOrder', 'ASC'], ['name', 'ASC']];
    if (sort === 'name') order = [['name', 'ASC']];
    if (sort === 'state') order = [['state', 'ASC']];
    if (sort === 'newest') order = [['createdAt', 'DESC']];

    const destinations = await this.findAll({
      where: this.applySoftDeleteScope(where),
      order,
    });

    const [partnerCounts, packageCounts] = await Promise.all([
      PartnerTieup.findAll({
        attributes: [
          [Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('location'))), 'loc'],
          [Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('subLocation'))), 'subLoc'],
          'category',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt'],
        ],
        group: [
          Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('location'))),
          Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('subLocation'))),
          'category',
        ],
        raw: true,
      }),
      Package.findAll({
        attributes: [
          [Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('destination'))), 'dest'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt'],
        ],
        group: [Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('destination')))],
        raw: true,
      }),
    ]);

    return {
      destinations,
      partnerCounts,
      packageCounts,
    };
  }

  /**
   * Find destination by name
   */
  async findByName(name, excludeId = null) {
    const where = { name: name.trim() };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return this.findOne(where);
  }
}

export default new DestinationRepository();
