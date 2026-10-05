import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  UploadCloud,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageStatus,
  uploadPackageImages,
} from '../../api/packages';
import { getAssets } from '../../api/assets';
import TierBadge from '../../components/common/TierBadge';
import CategoryChip from '../../components/common/CategoryChip';
import { formatINR } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { IPackage, PackageCategory, PackageTier, PriceUnit, IAsset } from '../../types';

interface PackageFormData {
  title: string;
  destination: string;
  category: PackageCategory;
  tier: PackageTier;
  price: number;
  originalPrice: number;
  priceUnit: PriceUnit;
  durationDays: number;
  durationNights: number;
  maxSeats: number;
  featured: boolean;
  images: string[];
  includedAssets: string[];
  availableVehicles: string[];
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
    stay?: string;
    meals?: string;
    activities?: string[];
  }>;
}

export default function AdminPackages(): React.ReactElement {
  const [packages, setPackages] = useState<IPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [assetsList, setAssetsList] = useState<IAsset[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPkg, setEditingPkg] = useState<IPackage | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const initialFormState: PackageFormData = {
    title: '',
    destination: 'Ooty',
    category: 'couple',
    tier: 'premium',
    price: 15000,
    originalPrice: 18000,
    priceUnit: 'per couple',
    durationDays: 3,
    durationNights: 2,
    maxSeats: 2,
    featured: false,
    images: [],
    includedAssets: [],
    availableVehicles: [],
    highlights: ['Scenic Hill Drive', 'Private Valley Resort Stay'],
    inclusions: ['AC Cab transportation', 'Daily Breakfast and Dinner'],
    exclusions: ['Personal expenses & camera fees'],
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Welcome Serenade',
        description: 'Warm reception and check-in to mountain resort.',
        stay: 'Valley View Resort',
        meals: 'Dinner',
        activities: ['Scenic Hill Drive', 'Check-in'],
      },
    ],
  };

  const [formData, setFormData] = useState<PackageFormData>(initialFormState);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  const fetchPackageList = async (): Promise<void> => {
    setLoading(true);
    try {
      const [res, assetsRes] = await Promise.all([
        getPackages({
          includeInactive: 'true',
          search,
          category: filterCategory,
          tier: filterTier,
          limit: 50,
        }),
        getAssets(),
      ]);

      if (res.success) {
        setPackages(res.packages || []);
      }
      if (assetsRes.success) {
        setAssetsList(assetsRes.assets || []);
      }
    } catch (err) {
      toast.error('Failed to load packages or assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackageList();
  }, [search, filterCategory, filterTier]);

  const handleOpenAdd = (): void => {
    setEditingPkg(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: any): void => {
    setEditingPkg(pkg);
    setFormData({
      title: pkg.title || '',
      destination: pkg.destination || 'Ooty',
      category: pkg.category || 'couple',
      tier: pkg.tier || 'premium',
      price: pkg.price || 0,
      originalPrice: pkg.originalPrice || 0,
      priceUnit: pkg.priceUnit || (pkg.category === 'couple' ? 'per couple' : 'per person'),
      durationDays: pkg.duration?.days || 3,
      durationNights: pkg.duration?.nights || 2,
      maxSeats: pkg.maxSeats || 14,
      featured: pkg.featured || false,
      images: pkg.images || [],
      includedAssets: (pkg.includedAssets || []).map((a: any) =>
        typeof a === 'object' && a?._id ? a._id : a
      ),
      availableVehicles: (pkg.availableVehicles || []).map((v: any) =>
        typeof v === 'object' && v?._id ? v._id : v
      ),
      highlights: pkg.highlights || [],
      inclusions: pkg.inclusions || [],
      exclusions: pkg.exclusions || [],
      itinerary: pkg.itinerary || [],
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string): Promise<void> => {
    try {
      const res = await togglePackageStatus(id);
      if (res.success) {
        toast.success(res.message);
        setPackages((prev) =>
          prev.map((p) => ((p._id || p.id) === id ? { ...p, status: res.package.status } : p))
        );
      }
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  const handleDeletePackage = async (): Promise<void> => {
    if (!deleteConfirmId) return;
    try {
      const res = await deletePackage(deleteConfirmId);
      if (res.success) {
        toast.success('Package deleted successfully');
        setPackages((prev) => prev.filter((p) => (p._id || p.id) !== deleteConfirmId));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      toast.error('Failed to delete package');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('images', files[i]);
    }

    setUploadingImage(true);
    try {
      const res = await uploadPackageImages(data);
      if (res.success && res.urls) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...res.urls],
        }));
        toast.success('Images uploaded successfully');
      }
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSavePackage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        destination: formData.destination,
        category: formData.category,
        tier: formData.tier,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        priceUnit: formData.priceUnit,
        duration: {
          days: Number(formData.durationDays),
          nights: Number(formData.durationNights),
        },
        maxSeats: Number(formData.maxSeats),
        featured: Boolean(formData.featured),
        images: formData.images,
        includedAssets: formData.includedAssets,
        availableVehicles: formData.availableVehicles,
        highlights: formData.highlights.filter(Boolean),
        inclusions: formData.inclusions.filter(Boolean),
        exclusions: formData.exclusions.filter(Boolean),
        itinerary: formData.itinerary,
      };

      if (editingPkg) {
        const pkgId = editingPkg._id || editingPkg.id;
        const res = await updatePackage(pkgId, payload);
        if (res.success) {
          toast.success('Package updated successfully');
          setIsModalOpen(false);
          fetchPackageList();
        }
      } else {
        const res = await createPackage(payload);
        if (res.success) {
          toast.success('Package created successfully');
          setIsModalOpen(false);
          fetchPackageList();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving package');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-text">
            Tour Packages Management
          </h2>
          <p className="text-xs text-muted">
            Create, update itineraries, and manage pricing for Couple & Stranger tiers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs shadow-elaichi flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Package</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search packages by title or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-surface border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-text focus:outline-none min-h-[40px]"
          >
            <option value="all">All Categories</option>
            <option value="couple">Couple</option>
            <option value="stranger">Stranger</option>
          </select>

          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="bg-surface border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-text focus:outline-none min-h-[40px]"
          >
            <option value="all">All Tiers</option>
            <option value="premium">Premium</option>
            <option value="extra_premium">Extra Premium</option>
          </select>
        </div>
      </div>

      {/* MOBILE CARD LIST (< 768px) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {packages.map((pkg) => {
          const pkgId = pkg._id || pkg.id;
          return (
            <div key={pkgId} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CategoryChip category={pkg.category} />
                  <TierBadge tier={pkg.tier} size="sm" />
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    pkg.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {pkg.status}
                </span>
              </div>

              <div>
                <h4 className="font-serif font-bold text-sm text-text">{pkg.title}</h4>
                <p className="text-xs text-muted">{pkg.destination} • {pkg.duration?.days}D/{pkg.duration?.nights}N</p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                <span className="font-bold text-primary-dark">{formatINR(pkg.price)} <span className="text-[10px] font-normal text-muted">/{pkg.priceUnit}</span></span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(pkgId)}
                    className="p-2 text-gray-500 hover:text-primary rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                    aria-label="Toggle status"
                  >
                    {pkg.status === 'active' ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(pkg)}
                    className="p-2 text-primary hover:bg-primary-light rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                    aria-label="Edit package"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(pkgId)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                    aria-label="Delete package"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW (>= 768px) */}
      <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-muted uppercase bg-surface/50">
              <th className="py-3.5 px-4">Package</th>
              <th className="py-3.5 px-4">Destination</th>
              <th className="py-3.5 px-4">Category & Tier</th>
              <th className="py-3.5 px-4">Price</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {packages.map((pkg) => {
              const pkgId = pkg._id || pkg.id;
              return (
                <tr key={pkgId} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-text max-w-xs">
                    <p className="truncate font-medium">{pkg.title}</p>
                    <span className="text-[11px] text-muted">{pkg.duration?.days}D / {pkg.duration?.nights}N</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-700">{pkg.destination}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <CategoryChip category={pkg.category} showLabel={false} />
                      <TierBadge tier={pkg.tier} size="sm" />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-primary-dark">
                    {formatINR(pkg.price)}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(pkgId)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer ${
                        pkg.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {pkg.status === 'active' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{pkg.status}</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(pkg)}
                        className="p-1.5 text-primary hover:bg-primary-light/50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Edit package"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(pkgId)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Delete package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT PACKAGE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-surface/50">
              <h3 className="font-serif text-lg font-bold text-text">
                {editingPkg ? 'Edit Tour Package' : 'Create New Tour Package'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSavePackage} className="p-6 overflow-y-auto space-y-5 text-xs pb-safe">
              {/* Title */}
              <div>
                <label className="block font-semibold text-text mb-1">Package Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Ooty Romantic Escape - Premium"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </div>

              {/* Destination, Category, Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-text mb-1">Destination *</label>
                  <select
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  >
                    <option value="Ooty">Ooty</option>
                    <option value="Munnar">Munnar</option>
                    <option value="Kodaikanal">Kodaikanal</option>
                    <option value="Wayanad">Wayanad</option>
                    <option value="Coorg">Coorg</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Category (Traveller) *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value as PackageCategory;
                      setFormData({
                        ...formData,
                        category: newCat,
                        priceUnit: newCat === 'couple' ? 'per couple' : 'per person',
                        maxSeats: newCat === 'couple' ? 2 : 14,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  >
                    <option value="couple">Couple Package</option>
                    <option value="stranger">Stranger Package</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Comfort Tier *</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as PackageTier })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  >
                    <option value="premium">Premium (3★ Resort)</option>
                    <option value="extra_premium">Extra Premium (5★ Luxury)</option>
                  </select>
                </div>
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-text mb-1">Price (INR) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Original Price (Strike)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Duration (Days / Nights)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                      className="w-1/2 px-2 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                    <input
                      type="number"
                      min={1}
                      value={formData.durationNights}
                      onChange={(e) => setFormData({ ...formData, durationNights: Number(e.target.value) })}
                      className="w-1/2 px-2 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block font-semibold text-text mb-1.5">Package Images</label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="file-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-1.5"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-primary" />
                    )}
                    <span className="font-semibold text-primary">Tap to upload photos</span>
                    <span className="text-[11px] text-muted">Supports camera capture on mobile</span>
                  </label>
                </div>

                {/* Uploaded images previews */}
                {formData.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border">
                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ATTACHED ASSETS & GEAR SELECTION */}
              <div className="p-4 rounded-2xl bg-surface border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text uppercase tracking-wider block">
                    🎒 Included Assets & Equipment
                  </span>
                  <span className="text-[11px] text-muted">
                    {formData.includedAssets.length} Selected
                  </span>
                </div>
                <p className="text-[11px] text-muted">
                  Choose tents, trekking poles, cameras, or amenities included or provided for travelers with this tour.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {assetsList
                    .filter((a) => a.category !== 'vehicle')
                    .map((asset) => {
                      const isChecked = formData.includedAssets.includes(asset._id || asset.id || '');
                      return (
                        <label
                          key={asset._id}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-primary-light/40 border-primary text-primary-dark font-medium'
                              : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const aId = asset._id || asset.id || '';
                              setFormData((prev) => ({
                                ...prev,
                                includedAssets: prev.includedAssets.includes(aId)
                                  ? prev.includedAssets.filter((id) => id !== aId)
                                  : [...prev.includedAssets, aId],
                              }));
                            }}
                            className="mt-0.5 rounded text-primary focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="block truncate font-semibold">{asset.name}</span>
                            <span className="text-[10px] text-muted block">
                              Rent: {formatINR(asset.rentPrice)}/{asset.rentUnit} • {asset.category}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* AVAILABLE TRANSPORT VEHICLES */}
              <div className="p-4 rounded-2xl bg-surface border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text uppercase tracking-wider block">
                    🚗 Permitted Transport Vehicles
                  </span>
                  <span className="text-[11px] text-muted">
                    {formData.availableVehicles.length} Allowed
                  </span>
                </div>
                <p className="text-[11px] text-muted">
                  Select which transport vehicles can be chosen by customers for this hill destination.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {assetsList
                    .filter((a) => a.category === 'vehicle')
                    .map((vehicle) => {
                      const isChecked = formData.availableVehicles.includes(vehicle._id || vehicle.id || '');
                      return (
                        <label
                          key={vehicle._id}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-medium'
                              : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const vId = vehicle._id || vehicle.id || '';
                              setFormData((prev) => ({
                                ...prev,
                                availableVehicles: prev.availableVehicles.includes(vId)
                                  ? prev.availableVehicles.filter((id) => id !== vId)
                                  : [...prev.availableVehicles, vId],
                              }));
                            }}
                            className="mt-0.5 rounded text-primary focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="block truncate font-semibold">{vehicle.name}</span>
                            <span className="text-[10px] text-muted block">
                              Tariff: {formatINR(vehicle.rentPrice)}/{vehicle.rentUnit} • {vehicle.vehicleSpecs?.seatingCapacity || 4} Seats
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Highlights & Inclusions */}
              <div>
                <label className="block font-semibold text-text mb-1">
                  Highlights (One per line)
                </label>
                <textarea
                  rows={2}
                  value={formData.highlights.join('\n')}
                  onChange={(e) =>
                    setFormData({ ...formData, highlights: e.target.value.split('\n') })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">
                  Inclusions (One per line)
                </label>
                <textarea
                  rows={2}
                  value={formData.inclusions.join('\n')}
                  onChange={(e) =>
                    setFormData({ ...formData, inclusions: e.target.value.split('\n') })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="featuredCheck" className="font-semibold text-text cursor-pointer">
                  Feature this package on homepage hero
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 min-h-[44px] px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 min-h-[44px] px-4 rounded-xl bg-primary text-white text-xs font-semibold shadow-elaichi active:scale-95 disabled:opacity-70 flex items-center justify-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Package</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-bold text-base text-text">Delete Tour Package?</h4>
              <p className="text-xs text-muted">
                Are you sure you want to permanently remove this package? Existing bookings won't be affected.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 min-h-[44px] rounded-xl border border-gray-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePackage}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-600 text-white text-xs font-semibold active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
