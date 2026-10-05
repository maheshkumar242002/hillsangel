import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  IndianRupee,
  Car,
  Tent,
  Compass,
  Camera,
  Flame,
  Layers,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  TrendingUp,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAssets,
  getAssetStats,
  createAsset,
  updateAsset,
  deleteAsset,
  uploadAssetImage,
} from '../../api/assets';
import { IAsset, IAssetStats, AssetCategory, AssetStatus } from '../../types';
import { formatINR } from '../../utils/formatters';

interface AssetFormData {
  name: string;
  assetCode: string;
  category: AssetCategory;
  buyPrice: number;
  rentPrice: number;
  rentUnit: 'per trip' | 'per day' | 'per person';
  quantity: number;
  availableQuantity: number;
  status: AssetStatus;
  imageUrl: string;
  description: string;
  vehicleSpecs: {
    seatingCapacity: number;
    vehicleType: 'sedan' | 'suv' | 'jeep' | 'tempo' | 'bike' | 'other';
    ac: boolean;
    transmission: string;
    fuelType: string;
  };
}

const initialFormState: AssetFormData = {
  name: '',
  assetCode: '',
  category: 'camping',
  buyPrice: 5000,
  rentPrice: 600,
  rentUnit: 'per trip',
  quantity: 2,
  availableQuantity: 2,
  status: 'available',
  imageUrl: '',
  description: '',
  vehicleSpecs: {
    seatingCapacity: 4,
    vehicleType: 'sedan',
    ac: true,
    transmission: 'Manual',
    fuelType: 'Diesel',
  },
};

export default function AdminAssets(): React.ReactElement {
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [stats, setStats] = useState<IAssetStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAsset, setEditingAsset] = useState<IAsset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [formData, setFormData] = useState<AssetFormData>(initialFormState);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [assetsRes, statsRes] = await Promise.all([
        getAssets({
          category: categoryFilter,
          status: statusFilter,
          search,
        }),
        getAssetStats(),
      ]);

      if (assetsRes.success) {
        setAssets(assetsRes.assets || []);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err: any) {
      toast.error('Failed to load asset data. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenCreateModal = () => {
    setEditingAsset(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asset: IAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      assetCode: asset.assetCode,
      category: asset.category,
      buyPrice: asset.buyPrice,
      rentPrice: asset.rentPrice,
      rentUnit: asset.rentUnit || 'per trip',
      quantity: asset.quantity,
      availableQuantity: asset.availableQuantity,
      status: asset.status,
      imageUrl: asset.imageUrl || '',
      description: asset.description || '',
      vehicleSpecs: {
        seatingCapacity: asset.vehicleSpecs?.seatingCapacity || 4,
        vehicleType: asset.vehicleSpecs?.vehicleType || 'sedan',
        ac: asset.vehicleSpecs?.ac ?? true,
        transmission: asset.vehicleSpecs?.transmission || 'Manual',
        fuelType: asset.vehicleSpecs?.fuelType || 'Diesel',
      },
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);
    setUploadingImage(true);

    try {
      const res = await uploadAssetImage(data);
      if (res.success && res.fileUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: res.fileUrl }));
        toast.success('Asset photo uploaded!');
      }
    } catch (err) {
      toast.error('Failed to upload image. Please try again or paste image URL.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter asset name');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<IAsset> = {
        name: formData.name.trim(),
        assetCode: formData.assetCode.trim().toUpperCase(),
        category: formData.category,
        buyPrice: Number(formData.buyPrice),
        rentPrice: Number(formData.rentPrice),
        rentUnit: formData.rentUnit,
        quantity: Number(formData.quantity),
        availableQuantity: Number(formData.availableQuantity),
        status: formData.status,
        imageUrl: formData.imageUrl,
        description: formData.description,
        ...(formData.category === 'vehicle' ? { vehicleSpecs: formData.vehicleSpecs } : {}),
      };

      if (editingAsset) {
        const res = await updateAsset(editingAsset._id || editingAsset.id || '', payload);
        if (res.success) {
          toast.success('Asset updated successfully!');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await createAsset(payload);
        if (res.success) {
          toast.success('New asset created successfully!');
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save asset';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      const res = await deleteAsset(id);
      if (res.success) {
        toast.success('Asset removed successfully');
        setDeleteConfirmId(null);
        fetchData();
      }
    } catch (err: any) {
      toast.error('Failed to delete asset');
    }
  };

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'vehicle':
        return <Car className="w-4 h-4 text-emerald-600" />;
      case 'camping':
        return <Tent className="w-4 h-4 text-amber-600" />;
      case 'trekking':
        return <Compass className="w-4 h-4 text-sky-600" />;
      case 'electronics':
        return <Camera className="w-4 h-4 text-purple-600" />;
      case 'amenity':
        return <Flame className="w-4 h-4 text-rose-600" />;
      default:
        return <Boxes className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-text">Assets & Inventory Management</h1>
            <span className="bg-primary-light text-primary-dark text-xs px-2.5 py-0.5 rounded-full font-bold">
              {assets.length} Assets
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted">
            Manage company assets (Vehicles, Camping Gear, Trekking Kits, Electronics) with Buy Price & Rental Tariff.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-gradient-elaichi text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-elaichi hover:shadow-elaichi-lg active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Asset</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
              Total Buy Investment
            </span>
            <span className="text-lg sm:text-2xl font-bold text-gray-800">
              {formatINR(stats.totalBuyInvestment)}
            </span>
            <span className="text-[11px] text-muted block">Purchase cost of all assets</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Rental Value Potential
            </span>
            <span className="text-lg sm:text-2xl font-bold text-emerald-700">
              {formatINR(stats.totalRentYieldPotential)}
            </span>
            <span className="text-[11px] text-emerald-600 block">Total rental income per trip</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
              Active Fleet & Gear
            </span>
            <span className="text-lg sm:text-2xl font-bold text-primary-dark">
              {stats.availableAssets} Available
            </span>
            <span className="text-[11px] text-muted block">Ready for customer bookings</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
              In-Use / Maintenance
            </span>
            <span className="text-lg sm:text-2xl font-bold text-amber-600">
              {stats.inUseAssets + stats.maintenanceAssets} Units
            </span>
            <span className="text-[11px] text-muted block">On trips or service check</span>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-gray-100">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by asset name, code (e.g. AST-VEH-01)..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            <option value="vehicle">🚗 Vehicles</option>
            <option value="camping">⛺ Camping Gear</option>
            <option value="trekking">🥾 Trekking Gear</option>
            <option value="electronics">📷 Electronics</option>
            <option value="amenity">🔥 Amenities & BBQ</option>
            <option value="other">📦 Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="available">🟢 Available</option>
            <option value="in_use">🔵 In Use</option>
            <option value="maintenance">🟠 Maintenance</option>
            <option value="retired">⚪ Retired</option>
          </select>
        </div>
      </div>

      {/* Assets Grid / Table */}
      {loading ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-muted">Loading assets catalogue...</span>
        </div>
      ) : assets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 space-y-3">
          <Boxes className="w-12 h-12 text-muted mx-auto stroke-1" />
          <h3 className="text-base font-bold text-text">No assets found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            No assets match your search criteria. Add your first vehicle, tent, or gear kit!
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-semibold"
          >
            Add Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Asset Image / Placeholder */}
                <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
                  {asset.imageUrl ? (
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-1">
                      {getCategoryIcon(asset.category)}
                      <span className="text-[10px] font-medium uppercase tracking-wider">No Photo</span>
                    </div>
                  )}

                  {/* Category & Status Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-text shadow-xs">
                      {getCategoryIcon(asset.category)}
                      <span>{asset.category}</span>
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        asset.status === 'available'
                          ? 'bg-emerald-500 text-white'
                          : asset.status === 'in_use'
                          ? 'bg-blue-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {asset.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-muted bg-gray-100 px-2 py-0.5 rounded">
                      {asset.assetCode}
                    </span>
                    <h3 className="font-bold text-text text-sm sm:text-base line-clamp-1">
                      {asset.name}
                    </h3>
                    {asset.description && (
                      <p className="text-xs text-muted line-clamp-2">{asset.description}</p>
                    )}
                  </div>

                  {/* Vehicle Specs Pill */}
                  {asset.category === 'vehicle' && asset.vehicleSpecs && (
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-muted">
                      <span className="bg-surface px-2 py-0.5 rounded border border-gray-100">
                        💺 {asset.vehicleSpecs.seatingCapacity || 4} Seats
                      </span>
                      <span className="bg-surface px-2 py-0.5 rounded border border-gray-100">
                        ❄️ {asset.vehicleSpecs.ac ? 'AC' : 'Non-AC'}
                      </span>
                      <span className="bg-surface px-2 py-0.5 rounded border border-gray-100">
                        ⚙️ {asset.vehicleSpecs.transmission || 'Manual'}
                      </span>
                    </div>
                  )}

                  {/* PRICING COMPARISON BAR (BUY PRICE VS RENT PRICE) */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-surface border border-gray-100">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted block">Buy Price:</span>
                      <span className="text-xs font-bold text-gray-700">
                        {formatINR(asset.buyPrice)}
                      </span>
                    </div>
                    <div className="text-right border-l border-gray-200 pl-2">
                      <span className="text-[10px] uppercase font-semibold text-primary block">Rent Price:</span>
                      <span className="text-sm font-bold text-primary-dark">
                        {formatINR(asset.rentPrice)}
                      </span>
                      <span className="text-[9px] text-muted block">/{asset.rentUnit || 'trip'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <span>
                      Stock: <strong className="text-text">{asset.availableQuantity}</strong> / {asset.quantity} units
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(asset)}
                  className="p-1.5 text-gray-600 hover:text-primary hover:bg-white rounded-lg transition-colors"
                  title="Edit Asset"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(asset._id)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                  title="Delete Asset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-text">Delete Asset?</h3>
            </div>
            <p className="text-xs text-muted">
              Are you sure you want to permanently remove this asset from inventory? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAsset(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-text">
                  {editingAsset ? 'Edit Asset & Pricing' : 'Add New Inventory Asset'}
                </h3>
                <p className="text-xs text-muted">Set asset specifications, purchase cost, and rental tariff.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-text hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Asset Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Asset Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toyota Innova Crysta SUV"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Asset Code / SKU <span className="text-muted font-normal">(Auto if blank)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AST-VEH-01"
                    value={formData.assetCode}
                    onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as AssetCategory })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="vehicle">🚗 Vehicle / Transport</option>
                    <option value="camping">⛺ Camping Gear</option>
                    <option value="trekking">🥾 Trekking Gear</option>
                    <option value="electronics">📷 Electronics / Camera</option>
                    <option value="amenity">🔥 Amenity & BBQ</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as AssetStatus })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="available">🟢 Available for Booking</option>
                    <option value="in_use">🔵 In Use on Active Tour</option>
                    <option value="maintenance">🟠 Under Maintenance</option>
                    <option value="retired">⚪ Retired / Disposed</option>
                  </select>
                </div>
              </div>

              {/* CRITICAL: BUY PRICE & RENT PRICE SECTION */}
              <div className="p-4 rounded-2xl bg-primary-light/30 border border-primary/20 space-y-3">
                <span className="text-xs font-bold text-primary-dark uppercase tracking-wider block">
                  Asset Valuation & Pricing Rates
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">
                      Buy Price (₹) <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.buyPrice}
                        onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                        placeholder="2450000"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <span className="text-[10px] text-muted">Purchase / Capex cost</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">
                      Rent Price (₹) <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-3.5 h-3.5 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.rentPrice}
                        onChange={(e) => setFormData({ ...formData, rentPrice: Number(e.target.value) })}
                        placeholder="3500"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-primary/40 bg-white text-xs sm:text-sm font-bold text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <span className="text-[10px] text-muted">Customer rental rate</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">Rent Unit</label>
                    <select
                      value={formData.rentUnit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rentUnit: e.target.value as 'per trip' | 'per day' | 'per person',
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="per trip">per trip</option>
                      <option value="per day">per day</option>
                      <option value="per person">per person</option>
                    </select>
                    <span className="text-[10px] text-muted">Billing unit</span>
                  </div>
                </div>
              </div>

              {/* Quantity & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Total Owned</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: Number(e.target.value),
                        availableQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Available Units</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.quantity}
                    value={formData.availableQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, availableQuantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Vehicle specific fields if category is vehicle */}
              {formData.category === 'vehicle' && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <span className="text-xs font-bold text-gray-700 block">🚗 Vehicle Specifications</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">Seats</label>
                      <input
                        type="number"
                        min="2"
                        value={formData.vehicleSpecs.seatingCapacity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vehicleSpecs: {
                              ...formData.vehicleSpecs,
                              seatingCapacity: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">Body Type</label>
                      <select
                        value={formData.vehicleSpecs.vehicleType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vehicleSpecs: {
                              ...formData.vehicleSpecs,
                              vehicleType: e.target.value as any,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                      >
                        <option value="sedan">Sedan</option>
                        <option value="suv">SUV</option>
                        <option value="jeep">4x4 Jeep</option>
                        <option value="tempo">Tempo Traveller</option>
                        <option value="bike">Bike / Himalayan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">Air Conditioning</label>
                      <select
                        value={formData.vehicleSpecs.ac ? 'yes' : 'no'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vehicleSpecs: {
                              ...formData.vehicleSpecs,
                              ac: e.target.value === 'yes',
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                      >
                        <option value="yes">AC Cabin</option>
                        <option value="no">Non-AC</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Upload & URL */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Asset Photo (Upload file or paste image URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <label className="cursor-pointer bg-surface border border-gray-200 hover:bg-gray-100 text-text px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0">
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-muted" />
                    )}
                    <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key features, capacity, condition, or maintenance instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-gradient-elaichi text-white text-xs sm:text-sm font-semibold shadow-elaichi hover:shadow-elaichi-lg active:scale-95 disabled:opacity-70 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Asset...</span>
                    </>
                  ) : (
                    <span>{editingAsset ? 'Update Asset' : 'Save Asset to Inventory'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
