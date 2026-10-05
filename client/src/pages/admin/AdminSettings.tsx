import React, { useState, useEffect } from 'react';
import { Save, Loader2, MessageCircle, Image } from 'lucide-react';
import { getSettings, updateSettings } from '../../api/settings';
import { useSettings } from '../../context/SettingsContext';
import toast from 'react-hot-toast';
import { ISettings } from '../../types';

export default function AdminSettings(): React.ReactElement {
  const { refreshSettings } = useSettings();
  const [formData, setFormData] = useState<ISettings>({
    siteName: 'Hills Angel Tours and Travels',
    tagline: 'Curated Hill-Station Retreats & Group Trails',
    whatsappNumber: '918111039182',
    contactPhone: '+91 81110 39182',
    contactEmail: 'info@hillsangels.com',
    address: 'Near Valley View Point, Ooty - Kotagiri Road, The Nilgiris, Tamil Nadu - 643001',
    socialLinks: {
      instagram: 'https://instagram.com/hillsangelstours',
      facebook: 'https://facebook.com/hillsangelstours',
      youtube: 'https://youtube.com/@hillsangelstours',
    },
    hero: {
      title: 'Discover the Mist-Clad Peaks of South India',
      subtitle:
        'Handcrafted hill-station journeys for couples seeking intimacy and solo wanderers craving shared adventures.',
      badgeText: 'Certified Hill-Station Tour Specialists',
      bannerImage:
        'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1920&q=80',
    },
  });

  const [, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchCurrentSettings = async (): Promise<void> => {
      try {
        const res = await getSettings();
        if (res.success && res.settings) {
          setFormData(res.settings);
        }
      } catch (err) {
        toast.error('Failed to load current settings');
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettings(formData);
      if (res.success) {
        toast.success('Settings updated successfully!');
        refreshSettings();
      }
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-text">
          Platform & Contact Settings
        </h2>
        <p className="text-xs text-muted">
          Update WhatsApp dispatch numbers, customer support hotlines, and homepage hero texts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* WhatsApp & Support Dispatch */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <h3 className="font-serif font-bold text-base text-text">
              Primary WhatsApp & Dispatch Number
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                WhatsApp Number (International format, no +) *
              </label>
              <input
                type="text"
                required
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="918111039182"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
              <span className="text-[11px] text-muted mt-1 block">
                All customer bookings and enquiries will be dispatched directly to this WhatsApp number.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Contact Phone Display
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+91 81110 39182"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Registered Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Homepage Hero Banner Configuration */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Image className="w-5 h-5 text-primary" />
            <h3 className="font-serif font-bold text-base text-text">
              Homepage Hero Banner Content
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Badge Headline
              </label>
              <input
                type="text"
                value={formData.hero?.badgeText || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, badgeText: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Main Hero Title
              </label>
              <input
                type="text"
                value={formData.hero?.title || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, title: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Subtitle Description
              </label>
              <textarea
                rows={2}
                value={formData.hero?.subtitle || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, subtitle: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Hero Background Image URL
              </label>
              <input
                type="url"
                value={formData.hero?.bannerImage || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, bannerImage: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[48px] px-8 py-3 rounded-2xl bg-gradient-elaichi text-white font-bold text-xs shadow-elaichi hover:shadow-elaichi-lg active:scale-95 disabled:opacity-70 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
