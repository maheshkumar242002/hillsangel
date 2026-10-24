import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Star,
  Users,
  BedDouble,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  Camera,
  Flame,
  Wifi,
  Car,
  Check,
  LayoutGrid,
  List,
  Coffee,
  IndianRupee,
  Tent,
  Home,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  uploadPartnerImage,
} from '../../api/partners';
import { IPartnerTieup, PartnerType, PricingModel } from '../../types';
import { formatINR } from '../../utils/formatters';

const STAY_TYPES = [
  { id: 'cottage', label: 'Cottage' },
  { id: 'resort', label: 'Resort' },
  { id: 'homestay', label: 'Homestay' },
  { id: 'tent', label: 'Mountain Tent' },
  { id: 'villa', label: 'Estate Villa' },
  { id: 'hotel', label: 'Hotel' },
];

const POPULAR_LOCATIONS = ['Ooty', 'Kodaikanal', 'Munnar', 'Wayanad', 'Coonoor', 'Valparai', 'Yercaud', 'Coorg'];

const DEFAULT_AMENITIES = [
  'Campfire 🔥',
  'BBQ Setup 🍖',
  'Hot Water Geyser ♨️',
  'Mountain View 🏔️',
  'Free WiFi 📶',
  'Car Parking 🅿️',
  'In-house Kitchen 🍳',
  'Estate Walk 🌲',
  'Power Backup ⚡',
];

interface CottageFormData {
  name: string;
  partnerCode: string;
  category: 'stay';
  type: PartnerType;
  location: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  pricingModel: PricingModel;
  pricePerPerson: number;
  pricePerRoom: number;
  pricePerTrip: number;
  capacity: number;
  maxGuestsPerRoom: number;
  amenities: string[];
  rating: number;
  status: 'active' | 'inactive';
  imageUrl: string;
  notes: string;
}

const emptyCottageForm: CottageFormData = {
  name: '',
  partnerCode: '',
  category: 'stay',
  type: 'cottage',
  location: 'Ooty',
  address: '',
  contactPerson: '',
  phone: '',
  email: '',
  pricingModel: 'per_room',
  pricePerPerson: 750,
  pricePerRoom: 2500,
  pricePerTrip: 0,
  capacity: 12,
  maxGuestsPerRoom: 3,
  amenities: ['Campfire 🔥', 'Hot Water Geyser ♨️', 'Mountain View 🏔️', 'Car Parking 🅿️'],
  rating: 4.8,
  status: 'active',
  imageUrl: '',
  notes: '',
};

export default function AdminCottages(): React.ReactElement {
  const [cottages, setCottages] = useState<IPartnerTieup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  // Filters & search
  const [search, setSearch] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCottage, setEditingCottage] = useState<IPartnerTieup | null>(null);
  const [formData, setFormData] = useState<CottageFormData>(emptyCottageForm);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fetchCottages = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await getPartners({
        category: 'stay',
        location: locationFilter === 'all' ? undefined : locationFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      if (res.success) {
        setCottages(res.partners || []);
      }
    } catch (err: any) {
      toast.error('Failed to load cottages & stays from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCottages();
  }, [locationFilter, typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCottages();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdd = () => {
    setEditingCottage(null);
    setFormData({
      ...emptyCottageForm,
      partnerCode: `COT-${Math.floor(100 + Math.random() * 900)}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cottage: IPartnerTieup) => {
    setEditingCottage(cottage);
    setFormData({
      name: cottage.name,
      partnerCode: cottage.partnerCode || `COT-${cottage.id}`,
      category: 'stay',
      type: (cottage.type as PartnerType) || 'cottage',
      location: cottage.location || 'Ooty',
      address: cottage.address || '',
      contactPerson: cottage.contactPerson || '',
      phone: cottage.phone || '',
      email: cottage.email || '',
      pricingModel: cottage.pricingModel || 'per_room',
      pricePerPerson: cottage.pricePerPerson || 750,
      pricePerRoom: cottage.pricePerRoom || 2500,
      pricePerTrip: cottage.pricePerTrip || 0,
      capacity: cottage.capacity || 10,
      maxGuestsPerRoom: cottage.maxGuestsPerRoom || 3,
      amenities: Array.isArray(cottage.amenities) ? cottage.amenities : [],
      rating: cottage.rating || 4.8,
      status: cottage.status || 'active',
      imageUrl: cottage.imageUrl || '',
      notes: cottage.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name} from Cottage Master?`)) return;
    try {
      await deletePartner(id);
      toast.success(`${name} removed successfully`);
      fetchCottages();
    } catch (err: any) {
      toast.error('Failed to delete cottage');
    }
  };

  const handleToggleStatus = async (cottage: IPartnerTieup) => {
    const nextStatus = cottage.status === 'active' ? 'inactive' : 'active';
    try {
      const id = cottage.id || cottage._id!;
      await updatePartner(id, { status: nextStatus });
      toast.success(`${cottage.name} is now ${nextStatus.toUpperCase()}`);
      fetchCottages();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    try {
      setUploadingPhoto(true);
      const res = await uploadPartnerImage(data);
      if (res.success) {
        setFormData((prev) => ({ ...prev, imageUrl: res.imageUrl }));
        toast.success('Cottage photo uploaded!');
      }
    } catch (err: any) {
      toast.error('Photo upload failed. You can paste an image URL instead.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = formData.amenities || [];
    if (current.includes(amenity)) {
      setFormData({ ...formData, amenities: current.filter((a) => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...current, amenity] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Cottage name and phone number are required');
      return;
    }

    try {
      setSaving(true);
      if (editingCottage) {
        const id = editingCottage.id || editingCottage._id!;
        await updatePartner(id, formData);
        toast.success(`Cottage ${formData.name} updated!`);
      } else {
        await createPartner(formData);
        toast.success(`New Cottage ${formData.name} added to Master!`);
      }
      setIsModalOpen(false);
      fetchCottages();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving cottage');
    } finally {
      setSaving(false);
    }
  };

  const totalCount = cottages.length;
  const activeCount = cottages.filter((c) => c.status === 'active').length;
  const avgRoomPrice =
    totalCount > 0
      ? Math.round(cottages.reduce((sum, c) => sum + (c.pricePerRoom || 0), 0) / totalCount)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Cottage & Resort Master</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {totalCount} Stays Registered
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Manage hill station cottages, tea estate homestays, tents, room rates & amenities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchCottages();
              toast.success('Cottages refreshed');
            }}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
            title="Refresh database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* View Mode Toggle: Table or Grid */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table View (Clean & Compact)"
            >
              <List className="w-4 h-4" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cards</span>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Cottage / Resort</span>
          </button>
        </div>
      </div>

      {/* 2. STAT PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">Total Stays</span>
            <span className="text-xl font-bold text-gray-900">{totalCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-100/60 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-emerald-700 font-medium block">Active Contracts</span>
            <span className="text-xl font-bold text-emerald-600">{activeCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-100/60 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-amber-700 font-medium block">Avg Room Rate</span>
            <span className="text-xl font-bold text-amber-600">{formatINR(avgRoomPrice)}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BedDouble className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-blue-100/60 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-blue-700 font-medium block">Hill Locations</span>
            <span className="text-xl font-bold text-blue-600">8+ Hubs</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by cottage name, location, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Location filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Locations</option>
            {POPULAR_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Stay Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Stay Types</option>
            {STAY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* 4. CONTENT: TABLE OR GRID */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Loading cottages & resorts from database...</p>
        </div>
      ) : cottages.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-100 space-y-2">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-800">No cottages or resorts found</p>
          <p className="text-xs text-gray-400">Add your first hill cottage or resort using the button above.</p>
          <button
            onClick={handleOpenAdd}
            className="text-xs text-emerald-600 font-semibold hover:underline"
          >
            + Register New Cottage
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Cottage / Stay</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Room & Person Rates</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Key Amenities</th>
                  <th className="py-3 px-4">Caretaker / Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {cottages.map((cottage) => (
                  <tr key={cottage.id || cottage._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        {cottage.imageUrl ? (
                          <img
                            src={cottage.imageUrl}
                            alt={cottage.name}
                            style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
                            onClick={() => setPreviewPhoto(cottage.imageUrl || null)}
                            className="rounded-xl object-cover border border-gray-200 cursor-pointer hover:scale-105 transition-transform shrink-0"
                          />
                        ) : (
                          <div
                            style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
                            className="rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0"
                          >
                            <Home className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{cottage.name}</span>
                            <span className="capitalize text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded">
                              {cottage.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono block">
                            Code: {cottage.partnerCode || `COT-${cottage.id}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-gray-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {cottage.location}
                      </span>
                      {cottage.address && (
                        <span className="text-[10px] text-gray-400 block line-clamp-1 mt-0.5">
                          {cottage.address}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4">
                      {cottage.pricePerRoom ? (
                        <div className="font-bold text-gray-900">
                          {formatINR(cottage.pricePerRoom)} <span className="text-[10px] text-gray-400 font-normal">/ room</span>
                        </div>
                      ) : null}
                      {cottage.pricePerPerson ? (
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {formatINR(cottage.pricePerPerson)} <span className="text-[10px] text-gray-400 font-normal">/ person</span>
                        </div>
                      ) : null}
                    </td>

                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-gray-800 block">
                        {cottage.capacity || 10} Total Guests
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        Max {cottage.maxGuestsPerRoom || 3} / room
                      </span>
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(Array.isArray(cottage.amenities) ? cottage.amenities : [])
                          .slice(0, 3)
                          .map((am, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded"
                            >
                              {am}
                            </span>
                          ))}
                        {(cottage.amenities || []).length > 3 && (
                          <span className="text-[10px] text-gray-400">
                            +{(cottage.amenities || []).length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      <span className="font-medium text-gray-800 block">{cottage.contactPerson || 'Caretaker'}</span>
                      <a
                        href={`tel:${cottage.phone}`}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-2.5 h-2.5" />
                        <span>{cottage.phone}</span>
                      </a>
                    </td>

                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(cottage)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                          cottage.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            cottage.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                        <span className="capitalize">{cottage.status}</span>
                      </button>
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(cottage)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Edit Cottage"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cottage.id || cottage._id!, cottage.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Cottage"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cottages.map((cottage) => (
            <div
              key={cottage.id || cottage._id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo / Banner */}
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                  {cottage.imageUrl ? (
                    <img
                      src={cottage.imageUrl}
                      alt={cottage.name}
                      onClick={() => setPreviewPhoto(cottage.imageUrl || null)}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-800">
                      <Home className="w-10 h-10 opacity-60" />
                      <span className="text-xs font-semibold mt-1 opacity-75">No Photo Added</span>
                    </div>
                  )}

                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs uppercase">
                    {cottage.type}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(cottage)}
                    className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-xs border ${
                      cottage.status === 'active'
                        ? 'bg-emerald-600/90 text-white border-emerald-400'
                        : 'bg-black/60 text-gray-300 border-gray-500'
                    }`}
                  >
                    {cottage.status === 'active' ? '● Active' : '○ Inactive'}
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{cottage.name}</h3>
                      <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{cottage.location}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(cottage)}
                        className="p-1 rounded text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cottage.id || cottage._id!, cottage.name)}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pricing pills */}
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-gray-50 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Room Rate</span>
                      <span className="font-bold text-gray-900">
                        {cottage.pricePerRoom ? formatINR(cottage.pricePerRoom) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Per Person</span>
                      <span className="font-bold text-emerald-700">
                        {cottage.pricePerPerson ? formatINR(cottage.pricePerPerson) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(cottage.amenities) ? cottage.amenities : []).slice(0, 4).map((am, i) => (
                      <span key={i} className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs bg-gray-50/50">
                <span className="text-gray-500 font-medium">
                  {cottage.contactPerson || 'Caretaker'}
                </span>
                <a
                  href={`tel:${cottage.phone}`}
                  className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>{cottage.phone}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. ADD / EDIT COTTAGE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    {editingCottage ? `Edit ${editingCottage.name}` : 'Register New Cottage / Resort'}
                  </h2>
                  <p className="text-[11px] text-gray-400">Save stay contract details directly into MySQL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Photo Upload & Preview */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="relative group shrink-0">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Cottage"
                      style={{ width: '60px', height: '60px', minWidth: '60px', minHeight: '60px' }}
                      className="rounded-xl object-cover border border-gray-200 shadow-2xs"
                    />
                  ) : (
                    <div
                      style={{ width: '60px', height: '60px', minWidth: '60px', minHeight: '60px' }}
                      className="rounded-xl bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center border border-emerald-100"
                    >
                      <Home className="w-6 h-6" />
                      <span className="text-[9px] font-bold mt-0.5">Photo</span>
                    </div>
                  )}

                  <label
                    htmlFor="cottage-photo-input"
                    className="absolute inset-0 bg-black/50 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[9px] font-bold"
                  >
                    <Camera className="w-3.5 h-3.5 mb-0.5" />
                    <span>Upload</span>
                  </label>
                  <input
                    type="file"
                    id="cottage-photo-input"
                    accept="image/*"
                    onChange={handleUploadPhoto}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">Cottage Photo</span>
                    {uploadingPhoto && (
                      <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Paste image URL (or click avatar to upload)"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Name & Stay Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cottage / Resort Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Misty Pine Wooden Cottages"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Stay Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  >
                    {STAY_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Hill Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Ooty, Munnar, Kodaikanal"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Near Botanical Garden Road, Ooty"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Pricing: Per Room & Per Person */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price per Room / Night ₹
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.pricePerRoom}
                    onChange={(e) => setFormData({ ...formData, pricePerRoom: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price per Person ₹
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.pricePerPerson}
                    onChange={(e) => setFormData({ ...formData, pricePerPerson: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Max Capacity (Guests)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Cottage Amenities
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_AMENITIES.map((am) => {
                    const isSelected = formData.amenities.includes(am);
                    return (
                      <button
                        key={am}
                        type="button"
                        onClick={() => toggleAmenity(am)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{am}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caretaker Contact & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Caretaker / Owner Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Ramesh (Caretaker)"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98421 11223"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Booking Notes & Policies
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Check-in 12:00 PM. Campfire firewood free for 1 night."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingPhoto}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-98"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCottage ? 'Update Cottage' : 'Save to Master'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Preview */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-lg">
            <img
              src={previewPhoto}
              alt="Cottage Preview"
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
