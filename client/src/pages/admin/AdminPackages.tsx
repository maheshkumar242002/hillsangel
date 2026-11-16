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
  Hotel,
  Utensils,
  MapPin,
  Phone,
  Sparkles,
  Fuel,
  Gauge,
  Calculator,
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
import { getPartners } from '../../api/partners';
import { getDestinations } from '../../api/destinations';
import TierBadge from '../../components/common/TierBadge';
import CategoryChip from '../../components/common/CategoryChip';
import { Modal, Button, Input, Select } from '../../components/common';
import { formatINR } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { IPackage, PackageCategory, PackageTier, PriceUnit, IAsset, IPartnerTieup, IDestination, IFuelConfig } from '../../types';

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
  stayPartnerId: number | string | null;
  foodPartnerId: number | string | null;
  selectedStayIds: Array<number | string>;
  selectedFoodIds: Array<number | string>;
  totalKm: number;
  fuelType: 'Diesel' | 'Petrol' | 'Electric' | 'CNG';
  mileage: number;
  fuelPrice: number;
  driverBatta: number;
  tollParking: number;
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
  const [partnersList, setPartnersList] = useState<IPartnerTieup[]>([]);
  const [destinationsList, setDestinationsList] = useState<IDestination[]>([]);
  const [stayAreaFilter, setStayAreaFilter] = useState<string>('all');
  const [foodAreaFilter, setFoodAreaFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPkg, setEditingPkg] = useState<IPackage | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const initialFormState: PackageFormData = {
    title: '',
    destination: 'Munnar',
    category: 'family',
    tier: 'premium',
    price: 5000,
    originalPrice: 6500,
    priceUnit: 'per jeep',
    durationDays: 1,
    durationNights: 0,
    maxSeats: 6,
    featured: false,
    images: [],
    includedAssets: [],
    availableVehicles: [],
    highlights: ['Scenic Hill Drive', 'Private Valley Resort Stay'],
    inclusions: ['AC Cab transportation', 'Daily Breakfast and Dinner'],
    exclusions: ['Personal expenses & camera fees'],
    stayPartnerId: null,
    foodPartnerId: null,
    selectedStayIds: [],
    selectedFoodIds: [],
    totalKm: 220,
    fuelType: 'Diesel',
    mileage: 12,
    fuelPrice: 94.5,
    driverBatta: 500,
    tollParking: 300,
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
      const [res, assetsRes, partnersRes, destsRes] = await Promise.all([
        getPackages({
          includeInactive: 'true',
          search,
          category: filterCategory,
          tier: filterTier,
          limit: 50,
        }),
        getAssets(),
        getPartners({ status: 'active' }),
        getDestinations({ status: 'active' }),
      ]);

      if (res.success) {
        setPackages(res.packages || []);
      }
      if (assetsRes.success) {
        setAssetsList(assetsRes.assets || []);
      }
      if (partnersRes?.success) {
        setPartnersList(partnersRes.partners || []);
      }
      if (destsRes?.success) {
        setDestinationsList(destsRes.destinations || []);
      }
    } catch (err) {
      toast.error('Failed to load packages, assets or partners');
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
    setStayAreaFilter('all');
    setFoodAreaFilter('all');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: any): void => {
    setEditingPkg(pkg);
    setStayAreaFilter('all');
    setFoodAreaFilter('all');
    setFormData({
      title: pkg.title || '',
      destination: pkg.destination || 'Munnar',
      category: pkg.category || 'family',
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
      stayPartnerId: pkg.stayPartnerId ?? (pkg.stayPartner?._id || pkg.stayPartner?.id) ?? null,
      foodPartnerId: pkg.foodPartnerId ?? (pkg.foodPartner?._id || pkg.foodPartner?.id) ?? null,
      selectedStayIds: pkg.selectedStayIds || (pkg.selectedStays ? pkg.selectedStays.map((s: any) => s._id || s.id) : []),
      selectedFoodIds: pkg.selectedFoodIds || (pkg.selectedFoods ? pkg.selectedFoods.map((f: any) => f._id || f.id) : []),
      totalKm: pkg.totalKm ?? pkg.fuelConfig?.totalKm ?? 220,
      fuelType: (pkg.fuelConfig?.fuelType as any) || 'Diesel',
      mileage: pkg.fuelConfig?.mileage ?? 12,
      fuelPrice: pkg.fuelConfig?.fuelPrice ?? 94.5,
      driverBatta: pkg.fuelConfig?.driverBatta ?? 500,
      tollParking: pkg.fuelConfig?.tollParking ?? 300,
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
        stayPartnerId: formData.stayPartnerId ? Number(formData.stayPartnerId) || formData.stayPartnerId : null,
        foodPartnerId: formData.foodPartnerId ? Number(formData.foodPartnerId) || formData.foodPartnerId : null,
        selectedStayIds: formData.selectedStayIds,
        selectedFoodIds: formData.selectedFoodIds,
        totalKm: Number(formData.totalKm) || 0,
        fuelConfig: {
          totalKm: Number(formData.totalKm) || 0,
          fuelType: formData.fuelType,
          mileage: Number(formData.mileage) || 12,
          fuelPrice: Number(formData.fuelPrice) || (formData.fuelType === 'Petrol' ? 102.8 : 94.5),
          estimatedLiters: Number(formData.totalKm) > 0 && Number(formData.mileage) > 0
            ? Number((Number(formData.totalKm) / Number(formData.mileage)).toFixed(1))
            : 0,
          totalFuelCost: Math.round(
            (Number(formData.totalKm) > 0 && Number(formData.mileage) > 0
              ? Number(formData.totalKm) / Number(formData.mileage)
              : 0) * (Number(formData.fuelPrice) || 94.5)
          ),
          driverBatta: Number(formData.driverBatta) || 0,
          tollParking: Number(formData.tollParking) || 0,
          costPerKm: Number(formData.totalKm) > 0
            ? Number(((Number(formData.fuelPrice) || 94.5) / (Number(formData.mileage) || 12)).toFixed(2))
            : 0,
          totalTransitCost:
            Math.round(
              (Number(formData.totalKm) > 0 && Number(formData.mileage) > 0
                ? Number(formData.totalKm) / Number(formData.mileage)
                : 0) * (Number(formData.fuelPrice) || 94.5)
            ) + (Number(formData.driverBatta) || 0) + (Number(formData.tollParking) || 0),
        },
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

  // Destination details & Sub-locations from Destination Master
  const currentDestObj = destinationsList.find(
    (d) => d.name.toLowerCase() === (formData.destination || '').toLowerCase()
  );
  const subLocationsForCurrentDest = currentDestObj?.subLocations || [];

  // Locations dynamically from Destination Master + partners + defaults
  const allDestinations = Array.from(
    new Set([
      ...destinationsList.map((d) => d.name),
      ...partnersList.map((p) => p.location).filter(Boolean),
      'Munnar',
      'Ooty',
      'Kodaikanal',
      'Wayanad',
      'Coorg',
      'Valparai',
    ])
  );

  // Stays in destination (unfiltered by area)
  const allStaysInDest = partnersList.filter(
    (p) =>
      p.category === 'stay' &&
      (!formData.destination ||
        p.location.toLowerCase().includes(formData.destination.toLowerCase()) ||
        formData.destination.toLowerCase().includes(p.location.toLowerCase()))
  );

  // Stays matching destination AND active area/sub-location filter
  const matchingStays = allStaysInDest.filter(
    (p) =>
      stayAreaFilter === 'all' ||
      (p.subLocation && p.subLocation.toLowerCase() === stayAreaFilter.toLowerCase())
  );

  // Foods in destination (unfiltered by area)
  const allFoodsInDest = partnersList.filter(
    (p) =>
      p.category === 'food' &&
      (!formData.destination ||
        p.location.toLowerCase().includes(formData.destination.toLowerCase()) ||
        formData.destination.toLowerCase().includes(p.location.toLowerCase()))
  );

  // Foods matching destination AND active area/sub-location filter
  const matchingFoods = allFoodsInDest.filter(
    (p) =>
      foodAreaFilter === 'all' ||
      (p.subLocation && p.subLocation.toLowerCase() === foodAreaFilter.toLowerCase())
  );

  const selectedStay = partnersList.find(
    (p) => String(p.id || p._id) === String(formData.stayPartnerId)
  );
  const selectedFood = partnersList.find(
    (p) => String(p.id || p._id) === String(formData.foodPartnerId)
  );

  // Live Fuel & Transit Economics calculations for form
  const totalKmNum = Number(formData.totalKm) || 0;
  const mileageNum = Number(formData.mileage) || 12;
  const fuelPriceNum = Number(formData.fuelPrice) || (formData.fuelType === 'Petrol' ? 102.8 : 94.5);
  const driverBattaNum = Number(formData.driverBatta) || 0;
  const tollParkingNum = Number(formData.tollParking) || 0;
  const estimatedLiters = totalKmNum > 0 && mileageNum > 0 ? Number((totalKmNum / mileageNum).toFixed(1)) : 0;
  const estimatedFuelCost = Math.round(estimatedLiters * fuelPriceNum);
  const costPerKm = totalKmNum > 0 ? Number((fuelPriceNum / mileageNum).toFixed(2)) : 0;
  const totalTransitCost = estimatedFuelCost + driverBattaNum + tollParkingNum;

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

        <Button
          variant="primary"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Package
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm items-center">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search packages by title or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-muted" />}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="family">Family Trip</option>
            <option value="friends">Friends Trip</option>
          </Select>

          <Select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
          >
            <option value="all">All Tiers</option>
            <option value="premium">Premium</option>
            <option value="extra_premium">Extra Premium</option>
          </Select>
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
                {(pkg.stayPartner || pkg.foodPartner || pkg.totalKm || pkg.fuelConfig) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {pkg.totalKm ? (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md font-medium border border-blue-200">
                        <Fuel className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>{pkg.totalKm} KM • {pkg.fuelConfig?.fuelType || 'Diesel'} (₹{pkg.fuelConfig?.totalFuelCost?.toLocaleString('en-IN') || Math.round((pkg.totalKm / (pkg.fuelConfig?.mileage || 12)) * (pkg.fuelConfig?.fuelPrice || 94.5)).toLocaleString('en-IN')})</span>
                      </span>
                    ) : null}
                    {pkg.stayPartner && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md font-medium border border-amber-200">
                        <Hotel className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate max-w-[140px]">{pkg.stayPartner.name}</span>
                      </span>
                    )}
                    {pkg.foodPartner && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-rose-50 text-rose-900 px-2 py-0.5 rounded-md font-medium border border-rose-200">
                        <Utensils className="w-3 h-3 text-rose-600 shrink-0" />
                        <span className="truncate max-w-[140px]">{pkg.foodPartner.name}</span>
                      </span>
                    )}
                  </div>
                )}
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
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs min-w-[900px]">
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
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted pt-0.5">
                      <span>{pkg.duration?.days}D / {pkg.duration?.nights}N</span>
                      {pkg.totalKm ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 font-medium">
                          <Fuel className="w-2.5 h-2.5 text-blue-600" />
                          <span>{pkg.totalKm} KM • {pkg.fuelConfig?.fuelType || 'Diesel'} (₹{pkg.fuelConfig?.totalFuelCost?.toLocaleString('en-IN') || Math.round((pkg.totalKm / (pkg.fuelConfig?.mileage || 12)) * (pkg.fuelConfig?.fuelPrice || 94.5)).toLocaleString('en-IN')})</span>
                        </span>
                      ) : null}
                      {pkg.stayPartner && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 font-normal">
                          <Hotel className="w-2.5 h-2.5 text-amber-600" />
                          <span className="truncate max-w-[110px]">{pkg.stayPartner.name}</span>
                        </span>
                      )}
                      {pkg.foodPartner && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-900 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60 font-normal">
                          <Utensils className="w-2.5 h-2.5 text-rose-600" />
                          <span className="truncate max-w-[110px]">{pkg.foodPartner.name}</span>
                        </span>
                      )}
                    </div>
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
      </div>

      {/* ADD / EDIT PACKAGE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="2xl"
        title={editingPkg ? 'Edit Tour Package' : 'Create New Tour Package'}
        subtitle="Configure tour itinerary details, comfort tier, and pricing"
      >
        <form onSubmit={handleSavePackage} className="space-y-5 text-xs">
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
                    onChange={(e) => {
                      setFormData({ ...formData, destination: e.target.value });
                      setStayAreaFilter('all');
                      setFoodAreaFilter('all');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  >
                    {allDestinations.map((dest) => {
                      const destObj = destinationsList.find((d) => d.name.toLowerCase() === dest.toLowerCase());
                      const countStays = partnersList.filter(
                        (p) => p.category === 'stay' && p.location.toLowerCase() === dest.toLowerCase()
                      ).length;
                      const countFoods = partnersList.filter(
                        (p) => p.category === 'food' && p.location.toLowerCase() === dest.toLowerCase()
                      ).length;
                      const placesCount = destObj?.subLocations?.length || 0;
                      return (
                        <option key={dest} value={dest}>
                          {dest} {placesCount > 0 ? `(${placesCount} Places • ` : '('}{countStays} Stays, {countFoods} Food)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Category (Safari Type) *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value as PackageCategory;
                      setFormData({
                        ...formData,
                        category: newCat,
                        priceUnit: 'per jeep',
                        maxSeats: 6,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  >
                    <option value="family">Family Trip</option>
                    <option value="friends">Friends Trip</option>
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

              {/* ⛽ TOUR TRANSIT, DISTANCE & FUEL CALCULATOR */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-sky-50/60 border border-blue-200/90 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Fuel className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                        <span>Tour Distance & Fuel Cost Calculator</span>
                        <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                          {formData.fuelType}
                        </span>
                      </h4>
                      <p className="text-xs text-gray-600">
                        Calculate total trip KM, vehicle mileage, fuel consumption & transit costs.
                      </p>
                    </div>
                  </div>
                  {totalKmNum > 0 && (
                    <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-xs">
                      <Gauge className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-900">
                        {totalKmNum} KM • ₹{estimatedFuelCost.toLocaleString('en-IN')} Fuel
                      </span>
                    </div>
                  )}
                </div>

                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* 1. Total KM */}
                  <div>
                    <label className="block font-semibold text-gray-800 text-xs mb-1 flex items-center justify-between">
                      <span>Total Estimated KM *</span>
                      <span className="text-[10px] text-blue-700 font-normal">Hill Circuit Distance</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={formData.totalKm}
                        onChange={(e) => setFormData({ ...formData, totalKm: Number(e.target.value) })}
                        placeholder="e.g. 220"
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-semibold pointer-events-none">KM</span>
                    </div>
                    {/* KM Quick Presets */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        { label: '120 KM', val: 120 },
                        { label: '220 KM', val: 220 },
                        { label: '350 KM', val: 350 },
                        { label: '480 KM', val: 480 },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, totalKm: preset.val })}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                            formData.totalKm === preset.val
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Fuel Type */}
                  <div>
                    <label className="block font-semibold text-gray-800 text-xs mb-1">Fuel Type *</label>
                    <select
                      value={formData.fuelType}
                      onChange={(e) => {
                        const newType = e.target.value as 'Diesel' | 'Petrol' | 'Electric' | 'CNG';
                        let defaultRate = formData.fuelPrice;
                        if (newType === 'Diesel') defaultRate = 94.5;
                        else if (newType === 'Petrol') defaultRate = 102.8;
                        else if (newType === 'Electric') defaultRate = 12.0;
                        else if (newType === 'CNG') defaultRate = 86.0;
                        setFormData({
                          ...formData,
                          fuelType: newType,
                          fuelPrice: defaultRate,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                    >
                      <option value="Diesel">Diesel (₹94.50/L)</option>
                      <option value="Petrol">Petrol (₹102.80/L)</option>
                      <option value="Electric">Electric (₹12/unit)</option>
                      <option value="CNG">CNG (₹86/kg)</option>
                    </select>
                    <p className="text-[10.5px] text-gray-500 mt-1">
                      Hill safaris & 4x4 jeeps mostly use Diesel
                    </p>
                  </div>

                  {/* 3. Mileage (km/L) */}
                  <div>
                    <label className="block font-semibold text-gray-800 text-xs mb-1 flex items-center justify-between">
                      <span>Vehicle Mileage *</span>
                      <span className="text-[10px] text-blue-700 font-normal">KM per Litre</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={40}
                        step={0.5}
                        value={formData.mileage}
                        onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                        placeholder="e.g. 12"
                        className="w-full px-3 py-2 pr-12 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs text-gray-500 font-semibold pointer-events-none">km/L</span>
                    </div>
                    {/* Mileage Presets */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        { label: 'Thar/Jeep (10)', val: 10 },
                        { label: 'Innova (12.5)', val: 12.5 },
                        { label: 'Van (9)', val: 9 },
                        { label: 'Sedan (15)', val: 15 },
                      ].map((m) => (
                        <button
                          key={m.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, mileage: m.val })}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                            formData.mileage === m.val
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Fuel Price */}
                  <div>
                    <label className="block font-semibold text-gray-800 text-xs mb-1 flex items-center justify-between">
                      <span>{formData.fuelType} Price *</span>
                      <span className="text-[10px] text-gray-500">₹ / Litre</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        step={0.5}
                        value={formData.fuelPrice}
                        onChange={(e) => setFormData({ ...formData, fuelPrice: Number(e.target.value) })}
                        placeholder="e.g. 94.50"
                        className="w-full px-3 py-2 pr-12 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-semibold pointer-events-none">₹/L</span>
                    </div>
                    <p className="text-[10.5px] text-gray-500 mt-1">Current hill station retail rate</p>
                  </div>
                </div>

                {/* Extra Transit Addons (Driver Batta & Toll) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-blue-200/50">
                  <div>
                    <label className="block font-semibold text-gray-800 text-xs mb-1 flex items-center justify-between">
                      <span>Mountain Pilot / Driver Allowance (Batta)</span>
                      <span className="text-[10px] text-muted">Per Tour</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={formData.driverBatta}
                        onChange={(e) => setFormData({ ...formData, driverBatta: Number(e.target.value) })}
                        placeholder="e.g. 500"
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-semibold pointer-events-none">₹</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-800 text-xs mb-1 flex items-center justify-between">
                      <span>Toll, Hill Entry & Parking Estimate</span>
                      <span className="text-[10px] text-muted">Per Tour</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={formData.tollParking}
                        onChange={(e) => setFormData({ ...formData, tollParking: Number(e.target.value) })}
                        placeholder="e.g. 300"
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-semibold pointer-events-none">₹</span>
                    </div>
                  </div>
                </div>

                {/* Live Financial Summary Banner */}
                <div className="bg-white rounded-xl p-3.5 border border-blue-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-blue-600" />
                      <span>Transit & Fuel Cost Breakdown:</span>
                    </span>
                    <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                      {formData.destination} Tour Circuit
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">Fuel Needed</span>
                      <span className="text-sm sm:text-base font-extrabold text-blue-950 block">
                        {estimatedLiters} <span className="text-[11px] font-normal text-blue-800">Liters</span>
                      </span>
                      <span className="text-[9.5px] text-blue-600">({totalKmNum} km ÷ {mileageNum} km/L)</span>
                    </div>

                    <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">Total Fuel Cost</span>
                      <span className="text-sm sm:text-base font-extrabold text-amber-950 block">
                        ₹{estimatedFuelCost.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9.5px] text-amber-700">({formData.fuelType} @ ₹{fuelPriceNum}/L)</span>
                    </div>

                    <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Cost / KM</span>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-950 block">
                        ₹{costPerKm} <span className="text-[11px] font-normal text-emerald-800">/ KM</span>
                      </span>
                      <span className="text-[9.5px] text-emerald-700">(Fuel efficiency)</span>
                    </div>

                    <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
                      <span className="text-[10px] uppercase font-bold text-indigo-800 block">Total Transit Cost</span>
                      <span className="text-sm sm:text-base font-extrabold text-indigo-950 block">
                        ₹{totalTransitCost.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9.5px] text-indigo-700">(Fuel + Batta + Toll)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🏨 LODGE & COTTAGE SELECTION (FILTERED BY DESTINATION) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Hotel className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                        <span>Stay & Lodge Partner</span>
                        <span className="text-[11px] font-semibold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                          {formData.destination}
                        </span>
                      </h4>
                      <p className="text-xs text-gray-600">
                        Lodges, cottages & resorts in <span className="font-semibold text-gray-800">{formData.destination}</span> ({allStaysInDest.length} total, {matchingStays.length} matching area)
                      </p>
                    </div>
                  </div>
                  {allStaysInDest.length > 0 && (
                    <span className="text-xs text-amber-900 font-medium bg-white px-2.5 py-1 rounded-lg border border-amber-200 self-start sm:self-auto">
                      {formData.stayPartnerId ? '✓ Lodge Attached' : 'Select Lodge Below'}
                    </span>
                  )}
                </div>

                {/* Sub-location / Area Filter Chips */}
                {subLocationsForCurrentDest.length > 0 && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-700" />
                        <span>Filter by Area / Place ({formData.destination}):</span>
                      </span>
                      {stayAreaFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setStayAreaFilter('all')}
                          className="text-[11px] text-amber-700 underline font-semibold"
                        >
                          Show All Places
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStayAreaFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          stayAreaFilter === 'all'
                            ? 'bg-amber-800 text-white shadow-xs'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        All Areas ({allStaysInDest.length})
                      </button>
                      {subLocationsForCurrentDest.map((sub) => {
                        const countInSub = allStaysInDest.filter(
                          (p) => p.subLocation?.toLowerCase() === sub.toLowerCase()
                        ).length;
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setStayAreaFilter(sub)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              stayAreaFilter.toLowerCase() === sub.toLowerCase()
                                ? 'bg-amber-800 text-white shadow-xs'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-300'
                            }`}
                          >
                            {sub} {countInSub > 0 ? `(${countInSub})` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {matchingStays.length === 0 ? (
                  <div className="bg-white/90 border border-dashed border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {allStaysInDest.length === 0
                        ? <>No lodges or cottages registered under <strong>"{formData.destination}"</strong> yet. Register them in <strong>Cottage Master</strong>.</>
                        : <>No lodges registered under <strong>"{stayAreaFilter}"</strong> in {formData.destination}. Try selecting another place above.</>
                      }
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-medium text-gray-800 text-xs mb-1">
                        Choose Lodge / Cottage *
                      </label>
                      <select
                        value={formData.stayPartnerId ? String(formData.stayPartnerId) : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            stayPartnerId: val ? val : null,
                            selectedStayIds: val ? [val] : [],
                          }));
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                      >
                        <option value="">-- No Lodge / Self Stay --</option>
                        {matchingStays.map((stay) => {
                          const stayId = String(stay.id || stay._id);
                          return (
                            <option key={stayId} value={stayId}>
                              {stay.name} • {stay.type?.toUpperCase()} — {stay.pricePerRoom > 0 ? `₹${stay.pricePerRoom}/room` : `₹${stay.pricePerPerson}/person`} ({stay.subLocation ? `${stay.subLocation}, ` : ''}{stay.location})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Selected Stay Detail Card */}
                    {selectedStay && (
                      <div className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-sm space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                              Attached Lodge / Resort
                            </span>
                            <h5 className="font-bold text-sm text-gray-900">{selectedStay.name}</h5>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{selectedStay.subLocation ? <strong className="text-amber-900 font-semibold">{selectedStay.subLocation}, </strong> : ''}{selectedStay.location} {selectedStay.address ? `• ${selectedStay.address}` : ''}</span>
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-xs font-semibold text-amber-900 block">
                              {selectedStay.pricePerRoom > 0 ? (
                                <>₹{selectedStay.pricePerRoom.toLocaleString('en-IN')} <span className="font-normal text-gray-500">/ room / night</span></>
                              ) : (
                                <>₹{selectedStay.pricePerPerson.toLocaleString('en-IN')} <span className="font-normal text-gray-500">/ person</span></>
                              )}
                            </span>
                            <span className="text-[11px] text-gray-500 block">
                              Max {selectedStay.maxGuestsPerRoom || 2} guests/room • {selectedStay.type?.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {selectedStay.phone && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                <Phone className="w-3 h-3 text-gray-500" /> {selectedStay.phone}
                              </span>
                            )}
                            {selectedStay.amenities?.slice(0, 3).map((am, i) => (
                              <span key={i} className="text-[11px] bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded-md">
                                {am}
                              </span>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const stayInclusion = `Stay at ${selectedStay.name} (${selectedStay.type || 'Lodge'})`;
                              if (!formData.inclusions.includes(stayInclusion)) {
                                setFormData((prev) => ({
                                  ...prev,
                                  inclusions: [...prev.inclusions, stayInclusion],
                                }));
                                toast.success('Added stay to package inclusions');
                              } else {
                                toast('Already added to inclusions', { icon: 'ℹ️' });
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-100/70 hover:bg-amber-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Inclusions</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 🍽️ RESTAURANT & DINING SELECTION (FILTERED BY DESTINATION) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                        <span>Restaurant & Dining Partner</span>
                        <span className="text-[11px] font-semibold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full">
                          {formData.destination}
                        </span>
                      </h4>
                      <p className="text-xs text-gray-600">
                        Restaurants, mess & cafes in <span className="font-semibold text-gray-800">{formData.destination}</span> ({allFoodsInDest.length} total, {matchingFoods.length} matching area)
                      </p>
                    </div>
                  </div>
                  {allFoodsInDest.length > 0 && (
                    <span className="text-xs text-rose-900 font-medium bg-white px-2.5 py-1 rounded-lg border border-rose-200 self-start sm:self-auto">
                      {formData.foodPartnerId ? '✓ Restaurant Attached' : 'Select Dining Below'}
                    </span>
                  )}
                </div>

                {/* Sub-location / Area Filter Chips */}
                {subLocationsForCurrentDest.length > 0 && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-700" />
                        <span>Filter by Area / Place ({formData.destination}):</span>
                      </span>
                      {foodAreaFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setFoodAreaFilter('all')}
                          className="text-[11px] text-rose-700 underline font-semibold"
                        >
                          Show All Places
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFoodAreaFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          foodAreaFilter === 'all'
                            ? 'bg-rose-800 text-white shadow-xs'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-rose-300'
                        }`}
                      >
                        All Areas ({allFoodsInDest.length})
                      </button>
                      {subLocationsForCurrentDest.map((sub) => {
                        const countInSub = allFoodsInDest.filter(
                          (p) => p.subLocation?.toLowerCase() === sub.toLowerCase()
                        ).length;
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setFoodAreaFilter(sub)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              foodAreaFilter.toLowerCase() === sub.toLowerCase()
                                ? 'bg-rose-800 text-white shadow-xs'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-rose-300'
                            }`}
                          >
                            {sub} {countInSub > 0 ? `(${countInSub})` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {matchingFoods.length === 0 ? (
                  <div className="bg-white/90 border border-dashed border-rose-300 rounded-xl p-3.5 text-xs text-rose-900 flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {allFoodsInDest.length === 0
                        ? <>No restaurants registered under <strong>"{formData.destination}"</strong> yet. Register them in <strong>Restaurant Master</strong>.</>
                        : <>No restaurants registered under <strong>"{foodAreaFilter}"</strong> in {formData.destination}. Try selecting another place above.</>
                      }
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-medium text-gray-800 text-xs mb-1">
                        Choose Restaurant / Dining Spot *
                      </label>
                      <select
                        value={formData.foodPartnerId ? String(formData.foodPartnerId) : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            foodPartnerId: val ? val : null,
                            selectedFoodIds: val ? [val] : [],
                          }));
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[44px]"
                      >
                        <option value="">-- No Dining / Self Food --</option>
                        {matchingFoods.map((food) => {
                          const foodId = String(food.id || food._id);
                          return (
                            <option key={foodId} value={foodId}>
                              {food.name} • {food.foodType?.toUpperCase()} ({food.type}) — {food.subLocation ? `${food.subLocation}, ` : ''}{food.location}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Selected Restaurant Detail Card */}
                    {selectedFood && (
                      <div className="bg-white rounded-xl p-3.5 border border-rose-200 shadow-sm space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">
                              Attached Dining Spot
                            </span>
                            <h5 className="font-bold text-sm text-gray-900">{selectedFood.name}</h5>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>{selectedFood.subLocation ? <strong className="text-rose-900 font-semibold">{selectedFood.subLocation}, </strong> : ''}{selectedFood.location} {selectedFood.address ? `• ${selectedFood.address}` : ''}</span>
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-xs font-semibold text-rose-900 block">
                              Food: {selectedFood.foodType === 'veg' ? 'Pure Veg' : selectedFood.foodType === 'non_veg' ? 'Non-Veg' : 'Veg & Non-Veg'}
                            </span>
                            <span className="text-[11px] text-gray-500 block">
                              {selectedFood.mealPricing?.fullDay
                                ? `Full Day ₹${selectedFood.mealPricing.fullDay}/person`
                                : `B: ₹${selectedFood.mealPricing?.breakfast || 0} • L: ₹${selectedFood.mealPricing?.lunch || 0} • D: ₹${selectedFood.mealPricing?.dinner || 0}`}
                            </span>
                          </div>
                        </div>

                        {/* Menu Inclusions Preview if available */}
                        {selectedFood.mealPricing?.menuDetails && (
                          <div className="bg-rose-50/50 rounded-lg p-2.5 text-[11px] space-y-1.5 border border-rose-100">
                            <span className="font-semibold text-rose-900 block flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-rose-600" />
                              <span>Menu Highlights Included in Tour:</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-gray-700">
                              {selectedFood.mealPricing.menuDetails.breakfast && (
                                <div className="bg-white/80 p-1.5 rounded border border-rose-100/70">
                                  <span className="font-semibold text-rose-800 block">Breakfast: </span>
                                  <span className="text-[10.5px]">
                                    {(selectedFood.mealPricing.menuDetails.breakfast?.rich?.items || (selectedFood.mealPricing.menuDetails.breakfast as any)?.richItems || selectedFood.mealPricing.menuDetails.breakfast?.lite?.items || (selectedFood.mealPricing.menuDetails.breakfast as any)?.liteItems || []).slice(0, 3).join(', ')}
                                  </span>
                                </div>
                              )}
                              {selectedFood.mealPricing.menuDetails.lunch && (
                                <div className="bg-white/80 p-1.5 rounded border border-rose-100/70">
                                  <span className="font-semibold text-rose-800 block">Lunch: </span>
                                  <span className="text-[10.5px]">
                                    {(selectedFood.mealPricing.menuDetails.lunch?.rich?.items || (selectedFood.mealPricing.menuDetails.lunch as any)?.richItems || selectedFood.mealPricing.menuDetails.lunch?.lite?.items || (selectedFood.mealPricing.menuDetails.lunch as any)?.liteItems || []).slice(0, 2).join(', ')}
                                  </span>
                                </div>
                              )}
                              {selectedFood.mealPricing.menuDetails.dinner && (
                                <div className="bg-white/80 p-1.5 rounded border border-rose-100/70">
                                  <span className="font-semibold text-rose-800 block">Dinner: </span>
                                  <span className="text-[10.5px]">
                                    {(selectedFood.mealPricing.menuDetails.dinner?.rich?.items || (selectedFood.mealPricing.menuDetails.dinner as any)?.richItems || selectedFood.mealPricing.menuDetails.dinner?.lite?.items || (selectedFood.mealPricing.menuDetails.dinner as any)?.liteItems || []).slice(0, 2).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            {selectedFood.phone && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                <Phone className="w-3 h-3 text-gray-500" /> {selectedFood.phone}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const foodInclusion = `Complimentary Meals & Dining at ${selectedFood.name}`;
                              if (!formData.inclusions.includes(foodInclusion)) {
                                setFormData((prev) => ({
                                  ...prev,
                                  inclusions: [...prev.inclusions, foodInclusion],
                                }));
                                toast.success('Added dining to package inclusions');
                              } else {
                                toast('Already added to inclusions', { icon: 'ℹ️' });
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800 hover:text-rose-950 bg-rose-100/70 hover:bg-rose-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Inclusions</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Save Package
                </Button>
              </div>
            </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        size="sm"
        title="Delete Tour Package?"
      >
        <div className="space-y-4 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-xs text-muted text-center">
            Are you sure you want to permanently remove this package? Existing bookings won't be affected.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              fullWidth
              onClick={handleDeletePackage}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
