import { BaseService } from './BaseService.js';
import settingsRepository from '../repository/settingsRepository.js';

export class SettingsService extends BaseService {
  constructor() {
    super(settingsRepository);
  }

  /**
   * Retrieve active website settings
   */
  async getSettings() {
    return settingsRepository.getSettings();
  }

  /**
   * Update website settings
   */
  async updateSettings(payload) {
    return settingsRepository.updateSettings(payload);
  }
}

export default new SettingsService();
