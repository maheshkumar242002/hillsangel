import { BaseRepository } from './BaseRepository.js';
import Settings from '../models/Settings.js';

export class SettingsRepository extends BaseRepository {
  constructor() {
    super(Settings);
  }

  /**
   * Get single settings row or initialize default record
   */
  async getSettings() {
    let settings = await Settings.findOne({
      order: [['id', 'ASC']],
    });

    if (!settings) {
      settings = await Settings.create({
        siteName: 'Hills Angel Tours and Travels',
        whatsappNumber: process.env.WHATSAPP_NUMBER || '918111039182',
        contactPhone: '+91 81110 39182',
        contactEmail: 'info@hillsangels.com',
      });
    }

    return settings;
  }

  /**
   * Update site settings
   */
  async updateSettings(payload) {
    let settings = await this.getSettings();
    await settings.update(payload);
    return settings;
  }
}

export default new SettingsRepository();
