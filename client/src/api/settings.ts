import { ISettings } from '../types';
import { mockSettings } from '../data/mockData';

const STORAGE_KEY = 'ha_mock_settings';

function getStoredSettings(): ISettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return { ...mockSettings };
}

function saveSettings(settings: ISettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {}
}

export const getSettings = async (): Promise<{ success: boolean; settings: ISettings }> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return {
    success: true,
    settings: getStoredSettings(),
  };
};

export const updateSettings = async (
  settingsData: Partial<ISettings>
): Promise<{ success: boolean; message: string; settings: ISettings }> => {
  const current = getStoredSettings();
  const updated = { ...current, ...settingsData };
  saveSettings(updated);
  return {
    success: true,
    message: 'Settings updated successfully',
    settings: updated,
  };
};
