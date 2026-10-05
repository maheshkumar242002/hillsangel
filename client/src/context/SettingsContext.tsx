import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSettings } from '../api/settings';
import { ISettings } from '../types';

interface SettingsContextType {
  settings: ISettings;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: ISettings = {
  siteName: 'Hills Angel Tours and Travels',
  tagline: 'Curated Hill-Station Retreats & Group Trails',
  whatsappNumber: '918111039182',
  contactPhone: '+91 81110 39182',
  contactEmail: 'info@hillsangels.com',
  address: 'Near Valley View Point, Ooty - Kotagiri Road, The Nilgiris, Tamil Nadu - 643001',
  hero: {
    title: 'Discover the Mist-Clad Peaks of South India',
    subtitle:
      'Handcrafted hill-station journeys for couples seeking intimacy and solo wanderers craving shared adventures.',
    badgeText: 'Certified Hill-Station Tour Specialists',
    bannerImage:
      'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1920&q=80',
  },
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ISettings>(defaultSettings);

  const fetchSettings = async () => {
    try {
      const res = await getSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.warn('Could not load dynamic settings, using default values.');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
