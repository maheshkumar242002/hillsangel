import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Star,
  Users,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  Camera,
  Coffee,
  IndianRupee,
  LayoutGrid,
  List,
  Sparkles,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  uploadPartnerImage,
} from '../../api/partners';
import { IPartnerTieup, PartnerType, FoodType } from '../../types';
import { formatINR } from '../../utils/formatters';

const DINING_TYPES = [
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'cafe', label: 'Hill Cafe' },
  { id: 'mess', label: 'Mess / Buffet' },
  { id: 'other', label: 'Catering / Dhaba' },
];

const FOOD_TYPES: Array<{ id: FoodType; label: string; badge: string }> = [
  { id: 'all', label: 'Veg & Non-Veg', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'veg', label: 'Pure Veg Only', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'non_veg', label: 'Non-Veg Specialty', badge: 'bg-rose-50 text-rose-800 border-rose-200' },
];

const POPULAR_LOCATIONS = ['Ooty', 'Kodaikanal', 'Munnar', 'Wayanad', 'Coonoor', 'Valparai', 'Yercaud', 'Coorg'];

interface RestaurantFormData {
  name: string;
  partnerCode: string;
  category: 'food';
  type: PartnerType;
  location: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  pricingModel: 'per_meal' | 'per_person';
  pricePerPerson: number;
  mealPricing: {
    breakfast: number;
    lunch: number;
    dinner: number;
    fullDay: number;
  };
  capacity: number;
  foodType: FoodType;
  amenities: string[];
  rating: number;
  status: 'active' | 'inactive';
  imageUrl: string;
  notes: string;
}

const emptyRestaurantForm: RestaurantFormData = {
  name: '',
  partnerCode: '',
  category: 'food',
  type: 'restaurant',
  location: 'Ooty',
  address: '',
  contactPerson: '',
  phone: '',
  email: '',
  pricingModel: 'per_meal',
  pricePerPerson: 350,
  mealPricing: {
    breakfast: 120,
    lunch: 220,
    dinner: 200,
    fullDay: 500,
  },
  capacity: 40,
  foodType: 'all',
  amenities: ['Buffet Setup', 'Tour Bus Parking', 'Clean Restrooms', 'Banana Leaf Meals'],
  rating: 4.8,
  status: 'active',
  imageUrl: '',
  notes: '',
};

export default function AdminRestaurants(): React.ReactElement {
  const [restaurants, setRestaurants] = useState<IPartnerTieup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  // Filters & search
  const [search, setSearch] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [foodTypeFilter, setFoodTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRestaurant, setEditingRestaurant] = useState<IPartnerTieup | null>(null);
  const [formData, setFormData] = useState<RestaurantFormData>(emptyRestaurantForm);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fetchRestaurants = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await getPartners({
        category: 'food',
        location: locationFilter === 'all' ? undefined : locationFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      if (res.success) {
        let list = res.partners || [];
        if (foodTypeFilter !== 'all') {
          list = list.filter((r) => r.foodType === foodTypeFilter);
        }
        setRestaurants(list);
      }
    } catch (err: any) {
      toast.error('Failed to load restaurants from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [locationFilter, typeFilter, foodTypeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdd = () => {
    setEditingRestaurant(null);
    setFormData({
      ...emptyRestaurantForm,
      partnerCode: `RES-${Math.floor(100 + Math.random() * 900)}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (restaurant: IPartnerTieup) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      partnerCode: restaurant.partnerCode || `RES-${restaurant.id}`,
      category: 'food',
      type: (restaurant.type as PartnerType) || 'restaurant',
      location: restaurant.location || 'Ooty',
      address: restaurant.address || '',
      contactPerson: restaurant.contactPerson || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      pricingModel: (restaurant.pricingModel as any) || 'per_meal',
      pricePerPerson: restaurant.pricePerPerson || 350,
      mealPricing: {
        breakfast: restaurant.mealPricing?.breakfast || 120,
        lunch: restaurant.mealPricing?.lunch || 220,
        dinner: restaurant.mealPricing?.dinner || 200,
        fullDay: restaurant.mealPricing?.fullDay || 500,
      },
      capacity: restaurant.capacity || 40,
      foodType: (restaurant.foodType as FoodType) || 'all',
      amenities: Array.isArray(restaurant.amenities) ? restaurant.amenities : [],
      rating: restaurant.rating || 4.8,
      status: restaurant.status || 'active',
      imageUrl: restaurant.imageUrl || '',
      notes: restaurant.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name} from Restaurant Master?`)) return;
    try {
      await deletePartner(id);
      toast.success(`${name} removed successfully`);
      fetchRestaurants();
    } catch (err: any) {
      toast.error('Failed to delete restaurant');
    }
  };

  const handleToggleStatus = async (restaurant: IPartnerTieup) => {
    const nextStatus = restaurant.status === 'active' ? 'inactive' : 'active';
    try {
      const id = restaurant.id || restaurant._id!;
      await updatePartner(id, { status: nextStatus });
      toast.success(`${restaurant.name} is now ${nextStatus.toUpperCase()}`);
      fetchRestaurants();
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
        toast.success('Restaurant photo uploaded!');
      }
    } catch (err: any) {
      toast.error('Upload failed. You can paste an image URL instead.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Restaurant name and phone number are required');
      return;
    }

    try {
      setSaving(true);
      if (editingRestaurant) {
        const id = editingRestaurant.id || editingRestaurant._id!;
        await updatePartner(id, formData);
        toast.success(`Restaurant ${formData.name} updated!`);
      } else {
        await createPartner(formData);
        toast.success(`New Restaurant ${formData.name} added to Master!`);
      }
      setIsModalOpen(false);
      fetchRestaurants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving restaurant');
    } finally {
      setSaving(false);
    }
  };

  const totalCount = restaurants.length;
  const activeCount = restaurants.filter((r) => r.status === 'active').length;
  const avgLunch =
    totalCount > 0
      ? Math.round(
          restaurants.reduce(
            (sum, r) => sum + (r.mealPricing?.lunch || r.pricePerPerson || 0),
            0
          ) / totalCount
        )
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Restaurant & Food Master</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                {totalCount} Dining Spots
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Manage hill dining spots, tourist messes, breakfast/lunch meal contracts & catering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchRestaurants();
              toast.success('Restaurants refreshed');
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
            className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Restaurant / Mess</span>
          </button>
        </div>
      </div>

      {/* 2. STAT PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">Total Dining Spots</span>
            <span className="text-xl font-bold text-gray-900">{totalCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-100/60 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-emerald-700 font-medium block">Active Tie-ups</span>
            <span className="text-xl font-bold text-emerald-600">{activeCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-100/60 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-amber-700 font-medium block">Avg Lunch / Meal</span>
            <span className="text-xl font-bold text-amber-600">{formatINR(avgLunch)}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Coffee className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-blue-100/60 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-blue-700 font-medium block">Group Capacity</span>
            <span className="text-xl font-bold text-blue-600">500+ Seats</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by restaurant name, food, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Location filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="all">All Locations</option>
            {POPULAR_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Dining Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="all">All Dining Types</option>
            {DINING_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Food Type (Veg / Non-Veg) */}
          <select
            value={foodTypeFilter}
            onChange={(e) => setFoodTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="all">Veg & Non-Veg</option>
            <option value="veg">Pure Veg Only</option>
            <option value="non_veg">Non-Veg Specialty</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
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
          <Loader2 className="w-7 h-7 animate-spin text-rose-600 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Loading restaurants from database...</p>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-100 space-y-2">
          <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-800">No restaurants found</p>
          <p className="text-xs text-gray-400">Add your first hill restaurant, mess, or dining spot.</p>
          <button
            onClick={handleOpenAdd}
            className="text-xs text-rose-600 font-semibold hover:underline"
          >
            + Register New Restaurant
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Restaurant / Spot</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Cuisine</th>
                  <th className="py-3 px-4">Meal Rates (BF / Lunch / Din)</th>
                  <th className="py-3 px-4">Seating</th>
                  <th className="py-3 px-4">Manager / Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id || restaurant._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        {restaurant.imageUrl ? (
                          <img
                            src={restaurant.imageUrl}
                            alt={restaurant.name}
                            style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
                            onClick={() => setPreviewPhoto(restaurant.imageUrl || null)}
                            className="rounded-xl object-cover border border-gray-200 cursor-pointer hover:scale-105 transition-transform shrink-0"
                          />
                        ) : (
                          <div
                            style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
                            className="rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0"
                          >
                            <UtensilsCrossed className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{restaurant.name}</span>
                            <span className="capitalize text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded">
                              {restaurant.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono block">
                            Code: {restaurant.partnerCode || `RES-${restaurant.id}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-gray-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-600" />
                        {restaurant.location}
                      </span>
                      {restaurant.address && (
                        <span className="text-[10px] text-gray-400 block line-clamp-1 mt-0.5">
                          {restaurant.address}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          restaurant.foodType === 'veg'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : restaurant.foodType === 'non_veg'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {restaurant.foodType === 'veg'
                          ? '🌱 Pure Veg'
                          : restaurant.foodType === 'non_veg'
                          ? '🍗 Non-Veg'
                          : 'Veg & Non-Veg'}
                      </span>
                    </td>

                    <td className="py-2.5 px-4">
                      {restaurant.mealPricing ? (
                        <div className="space-y-0.5 text-[11px]">
                          <span className="text-gray-600 block">
                            BF: <b className="text-gray-900">{formatINR(restaurant.mealPricing.breakfast || 0)}</b> • 
                            Lunch: <b className="text-gray-900">{formatINR(restaurant.mealPricing.lunch || 0)}</b>
                          </span>
                          <span className="text-gray-500 block text-[10px]">
                            Dinner: {formatINR(restaurant.mealPricing.dinner || 0)} • Full Day: <b className="text-rose-700">{formatINR(restaurant.mealPricing.fullDay || 0)}</b>
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-gray-900">
                          {formatINR(restaurant.pricePerPerson || 350)} / meal
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-gray-800 block">
                        {restaurant.capacity || 40} Seats
                      </span>
                    </td>

                    <td className="py-2.5 px-4">
                      <span className="font-medium text-gray-800 block">{restaurant.contactPerson || 'Manager'}</span>
                      <a
                        href={`tel:${restaurant.phone}`}
                        className="text-[11px] font-semibold text-rose-700 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-2.5 h-2.5" />
                        <span>{restaurant.phone}</span>
                      </a>
                    </td>

                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(restaurant)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                          restaurant.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            restaurant.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                        <span className="capitalize">{restaurant.status}</span>
                      </button>
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(restaurant)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Edit Restaurant"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(restaurant.id || restaurant._id!, restaurant.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Restaurant"
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
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id || restaurant._id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                  {restaurant.imageUrl ? (
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      onClick={() => setPreviewPhoto(restaurant.imageUrl || null)}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-orange-100 text-rose-800">
                      <UtensilsCrossed className="w-10 h-10 opacity-60" />
                      <span className="text-xs font-semibold mt-1 opacity-75">No Photo Added</span>
                    </div>
                  )}

                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs uppercase">
                    {restaurant.type}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(restaurant)}
                    className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-xs border ${
                      restaurant.status === 'active'
                        ? 'bg-emerald-600/90 text-white border-emerald-400'
                        : 'bg-black/60 text-gray-300 border-gray-500'
                    }`}
                  >
                    {restaurant.status === 'active' ? '● Active' : '○ Inactive'}
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{restaurant.name}</h3>
                      <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-600" />
                        <span>{restaurant.location}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(restaurant)}
                        className="p-1 rounded text-gray-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(restaurant.id || restaurant._id!, restaurant.name)}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Meal Rates */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-gray-50 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Breakfast</span>
                      <span className="font-bold text-gray-800">
                        {restaurant.mealPricing?.breakfast ? formatINR(restaurant.mealPricing.breakfast) : 'N/A'}
                      </span>
                    </div>
                    <div className="border-x border-gray-200">
                      <span className="text-[10px] text-gray-400 block">Lunch</span>
                      <span className="font-bold text-gray-900">
                        {restaurant.mealPricing?.lunch ? formatINR(restaurant.mealPricing.lunch) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Dinner</span>
                      <span className="font-bold text-gray-800">
                        {restaurant.mealPricing?.dinner ? formatINR(restaurant.mealPricing.dinner) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(restaurant.amenities) ? restaurant.amenities : []).slice(0, 3).map((am, i) => (
                      <span key={i} className="text-[10px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs bg-gray-50/50">
                <span className="text-gray-500 font-medium">{restaurant.contactPerson || 'Manager'}</span>
                <a
                  href={`tel:${restaurant.phone}`}
                  className="font-bold text-rose-700 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>{restaurant.phone}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. ADD / EDIT RESTAURANT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    {editingRestaurant ? `Edit ${editingRestaurant.name}` : 'Register New Restaurant / Food Spot'}
                  </h2>
                  <p className="text-[11px] text-gray-400">Save dining rates directly into MySQL Master</p>
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
                      alt="Restaurant"
                      style={{ width: '60px', height: '60px', minWidth: '60px', minHeight: '60px' }}
                      className="rounded-xl object-cover border border-gray-200 shadow-2xs"
                    />
                  ) : (
                    <div
                      style={{ width: '60px', height: '60px', minWidth: '60px', minHeight: '60px' }}
                      className="rounded-xl bg-rose-50 text-rose-600 flex flex-col items-center justify-center border border-rose-100"
                    >
                      <UtensilsCrossed className="w-6 h-6" />
                      <span className="text-[9px] font-bold mt-0.5">Photo</span>
                    </div>
                  )}

                  <label
                    htmlFor="restaurant-photo-input"
                    className="absolute inset-0 bg-black/50 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[9px] font-bold"
                  >
                    <Camera className="w-3.5 h-3.5 mb-0.5" />
                    <span>Upload</span>
                  </label>
                  <input
                    type="file"
                    id="restaurant-photo-input"
                    accept="image/*"
                    onChange={handleUploadPhoto}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">Restaurant Photo</span>
                    {uploadingPhoto && (
                      <span className="text-[10px] text-rose-600 flex items-center gap-1 font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Paste image URL (or click icon to upload file)"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Name & Dining Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Restaurant / Spot Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Nilgiri Traditional Banana Leaf Mess"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Dining Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  >
                    {DINING_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & Food Type */}
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
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cuisine Specialty
                  </label>
                  <select
                    value={formData.foodType}
                    onChange={(e) => setFormData({ ...formData, foodType: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  >
                    <option value="all">Veg & Non-Veg (Multi-Cuisine)</option>
                    <option value="veg">Pure Veg Only (Brahmin / Jain / South Indian)</option>
                    <option value="non_veg">Non-Veg Specialty (Chettinad / Malabar)</option>
                  </select>
                </div>
              </div>

              {/* Meal Pricing Breakdown */}
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2">
                <span className="text-xs font-bold text-gray-900 block">
                  Per Head Meal Pricing Rates (₹)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Breakfast ₹</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.mealPricing.breakfast}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mealPricing: { ...formData.mealPricing, breakfast: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Lunch ₹</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.mealPricing.lunch}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mealPricing: { ...formData.mealPricing, lunch: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Dinner ₹</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.mealPricing.dinner}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mealPricing: { ...formData.mealPricing, dinner: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 mb-0.5">Full Day ₹</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.mealPricing.fullDay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mealPricing: { ...formData.mealPricing, fullDay: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white font-bold text-rose-700"
                    />
                  </div>
                </div>
              </div>

              {/* Seating Capacity & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
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
                    placeholder="e.g. Commercial Road, Near Charring Cross, Ooty"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Manager & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Manager / Cashier Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Anand (Manager)"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
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
                    placeholder="+91 98421 99001"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Menu Notes & Group Catering Terms
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Special banana leaf buffet with 12 items. Parking for 2 Tempo Travellers."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-98"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingRestaurant ? 'Update Restaurant' : 'Save to Master'}</span>
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
              alt="Restaurant Preview"
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
