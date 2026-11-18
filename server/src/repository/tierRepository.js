import { BaseRepository } from './BaseRepository.js';
import Tier from '../models/Tier.js';

export class TierRepository extends BaseRepository {
  constructor() {
    super(Tier);
  }

  async findByKey(key) {
    return this.findOne({ key });
  }
}

export default new TierRepository();
