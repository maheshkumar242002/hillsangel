import { BaseRepository } from './BaseRepository.js';
import Admin from '../models/Admin.js';

export class AdminRepository extends BaseRepository {
  constructor() {
    super(Admin);
  }

  /**
   * Find admin by username
   * @param {string} username
   */
  async findByUsername(username) {
    return this.findOne({ username });
  }

  /**
   * Find admin by email
   * @param {string} email
   */
  async findByEmail(email) {
    return this.findOne({ email });
  }
}

export default new AdminRepository();
