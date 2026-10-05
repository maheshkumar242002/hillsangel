import api from './axios';
import { ISettings } from '../types';

export const getSettings = async (): Promise<{ success: boolean; settings: ISettings }> => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (
  settingsData: Partial<ISettings>
): Promise<{ success: boolean; message: string; settings: ISettings }> => {
  const response = await api.put('/settings', settingsData);
  return response.data;
};
