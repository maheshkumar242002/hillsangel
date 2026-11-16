import React, { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  MessageCircle,
  Image,
  Users,
  Percent,
  IndianRupee,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { getSettings, updateSettings } from '../../api/settings';
import { useSettings } from '../../context/SettingsContext';
import toast from 'react-hot-toast';
import { ISettings, IOrganizerPartnerConfig } from '../../types';

export default function AdminSettings(): React.ReactElement {
  const { refreshSettings } = useSettings();
  const [formData, setFormData] = useState<ISettings>({
    siteName: 'Hills Angel Tours and Travels',
    tagline: 'Curated Hill-Station Retreats & Group Trails',
    whatsappNumber: '918111039182',
    contactPhone: '+91 81110 39182',
    contactEmail: 'info@hillsangels.com',
    address: 'Perur, Coimbatore South, Coimbatore, Tamil Nadu - 641026',
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
    organizerPartners: {
      enabled: true,
      splitMode: 'percentage',
      partners: [
        {
          id: 'p1',
          name: 'Partner 1 (mohan)',
          phone: '+91 81110 39182',
          sharePercent: 50,
          upiId: '',
          role: 'Lead Organizer',
        },
        {
          id: 'p2',
          name: 'Partner 2 (Co-Organizer)',
          phone: '',
          sharePercent: 50,
          upiId: '',
          role: 'Co-Organizer',
        },
      ],
      notes: 'Only Net Profit is shared after deducting all direct tour expenses (Stay, Food & Fuel/Driver)',
    },
  });

  const [, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchCurrentSettings = async (): Promise<void> => {
      try {
        const res = await getSettings();
        if (res.success && res.settings) {
          const s = res.settings;
          // Ensure partners array is present if migrating from partner1/partner2
          if (s.organizerPartners && (!s.organizerPartners.partners || s.organizerPartners.partners.length === 0)) {
            s.organizerPartners.partners = [
              {
                id: 'p1',
                name: s.organizerPartners.partner1?.name || 'Partner 1 (mohan)',
                phone: s.organizerPartners.partner1?.phone || '+91 81110 39182',
                sharePercent: s.organizerPartners.partner1?.sharePercent ?? 50,
                upiId: s.organizerPartners.partner1?.upiId || '',
                role: 'Lead Organizer',
              },
              {
                id: 'p2',
                name: s.organizerPartners.partner2?.name || 'Partner 2 (Co-Organizer)',
                phone: s.organizerPartners.partner2?.phone || '',
                sharePercent: s.organizerPartners.partner2?.sharePercent ?? 50,
                upiId: s.organizerPartners.partner2?.upiId || '',
                role: 'Co-Organizer',
              },
            ];
          }
          setFormData(s);
        }
      } catch (err) {
        toast.error('Failed to load current settings');
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentSettings();
  }, []);

  // Dynamic partners list
  const currentPartners: IOrganizerPartnerConfig[] = formData.organizerPartners?.partners || [
    {
      id: 'p1',
      name: 'Partner 1 (mohan)',
      phone: '+91 81110 39182',
      sharePercent: 50,
      upiId: '',
      role: 'Lead Organizer',
    },
    {
      id: 'p2',
      name: 'Partner 2 (Co-Organizer)',
      phone: '',
      sharePercent: 50,
      upiId: '',
      role: 'Co-Organizer',
    },
  ];

  const totalShareAllocated = currentPartners.reduce(
    (sum, p) => sum + (Number(p.sharePercent) || 0),
    0
  );

  const handleAddPartner = () => {
    const newPartner: IOrganizerPartnerConfig = {
      id: `partner-${Date.now()}`,
      name: `Partner ${currentPartners.length + 1}`,
      phone: '',
      sharePercent: 0,
      upiId: '',
      role: 'Co-Organizer',
    };
    const updated = [...currentPartners, newPartner];
    setFormData((prev) => ({
      ...prev,
      organizerPartners: {
        enabled: true,
        ...prev.organizerPartners,
        partners: updated,
        partner1: updated[0],
        partner2: updated[1],
      },
    }));
  };

  const handleUpdatePartnerField = (index: number, field: keyof IOrganizerPartnerConfig, value: any) => {
    const updated = currentPartners.map((p, i) => (i === index ? { ...p, [field]: value } : p));
    setFormData((prev) => ({
      ...prev,
      organizerPartners: {
        enabled: true,
        ...prev.organizerPartners,
        partners: updated,
        partner1: updated[0],
        partner2: updated[1],
      },
    }));
  };

  const handleRemovePartner = (index: number) => {
    if (currentPartners.length <= 1) {
      toast.error('You need at least 1 partner in the profit split');
      return;
    }
    const updated = currentPartners.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      organizerPartners: {
        enabled: true,
        ...prev.organizerPartners,
        partners: updated,
        partner1: updated[0],
        partner2: updated[1],
      },
    }));
  };

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

        {/* Co-Organizing Partners & Net Profit Sharing Settings */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-serif font-bold text-base text-text">
                  Co-Organizing Partners & Net Profit Sharing
                </h3>
                <p className="text-xs text-muted">
                  Add organizing partners and define each partner's profit share percentage. Only Net Profit is shared!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${totalShareAllocated === 100
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
              >
                {totalShareAllocated === 100 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>Total Allocated: {totalShareAllocated}%</span>
              </span>

              <button
                type="button"
                onClick={handleAddPartner}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#192D20] text-white hover:bg-[#25422F] text-xs font-semibold shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Partner</span>
              </button>
            </div>
          </div>

          {/* Golden Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <span className="p-1 rounded-lg bg-amber-200/80 text-amber-900 shrink-0 mt-0.5">
              <IndianRupee className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="font-bold text-amber-900">Profit Sharing Rule (நிகர லாபம் மட்டுமே):</strong>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Gross Tour Revenue-லிருந்து நேரடி செலவுகள் (Cottage/Hotel Stay + Restaurant/Food + Jeep Fuel & Driver Bata) கழிக்கப்பட்ட பிறகு, கிடைக்கும் <strong>Net Organizing Profit (நிகர லாபம்)</strong> மட்டுமே இங்குள்ள பார்ட்னர்களுக்கு அவரவர் சதவீதத்தின்படி பகிர்ந்து வழங்கப்படும்.
              </p>
            </div>
          </div>

          {/* Dynamic Partners Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPartners.map((partner, index) => (
              <div
                key={partner.id || index}
                className="p-4 rounded-2xl bg-surface/70 border border-gray-100 hover:border-gray-200 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary-dark font-bold text-xs flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-primary-dark uppercase tracking-wider">
                      Partner {index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-primary text-white font-mono">
                      {partner.sharePercent || 0}% Profit Share
                    </span>

                    {currentPartners.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePartner(index)}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove partner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text mb-1">Partner Name *</label>
                  <input
                    type="text"
                    required
                    value={partner.name}
                    onChange={(e) => handleUpdatePartnerField(index, 'name', e.target.value)}
                    placeholder="e.g. mohan Kumar"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-text mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={partner.phone || ''}
                      onChange={(e) => handleUpdatePartnerField(index, 'phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text mb-1">Profit Share % *</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={partner.sharePercent}
                      onChange={(e) =>
                        handleUpdatePartnerField(
                          index,
                          'sharePercent',
                          Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-primary font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text mb-1">UPI ID / Bank Settlement</label>
                  <input
                    type="text"
                    value={partner.upiId || ''}
                    onChange={(e) => handleUpdatePartnerField(index, 'upiId', e.target.value)}
                    placeholder="e.g. partner@okaxis"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text mb-1">
              Internal Profit Agreement Notes
            </label>
            <input
              type="text"
              value={formData.organizerPartners?.notes || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  organizerPartners: {
                    enabled: true,
                    ...formData.organizerPartners,
                    partners: currentPartners,
                    notes: e.target.value,
                  },
                })
              }
              placeholder="e.g. Only Net Profit is shared after deducting Stay, Food & Fuel/Driver expenses per tour."
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
            />
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
