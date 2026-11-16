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
  FileText,
  Copy,
  ChevronRight,
  Flame,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  uploadPartnerImage,
} from '../../api/partners';
import { getDestinations } from '../../api/destinations';
import { IPartnerTieup, PartnerType, FoodType, IMealMenuInclusions, IDestination } from '../../types';
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

export const DEFAULT_MENU_DETAILS: IMealMenuInclusions = {
  breakfast: {
    lite: {
      price: 100,
      items: ['Idly (2)', 'Crispy Dosa (1)', 'Sambar', '2 Chutneys', 'Tea / Coffee'],
      description: 'Standard Light Breakfast: Idly, Crispy Dosa, hot Sambar & Chutneys with Tea/Coffee',
    },
    rich: {
      price: 160,
      items: ['Idly (2)', 'Ghee Roast Dosa', 'Medu Vada (1)', 'Poori Masala', 'Sweet Kesari', 'Filter Coffee'],
      description: 'Executive Feast Breakfast: Medu Vada, Poori Masala, Mini Ghee Roast & Kesari',
    },
  },
  lunch: {
    lite: {
      price: 160,
      items: ['South Indian Full Meals', 'Unlimited Steamed Rice', 'Sambar', 'Rasam', 'Kara Kuzhambu', 'Poriyal & Kootu', 'Curd', 'Appalam'],
      description: 'Traditional Full Meals with aromatic Sambar, Rasam, seasonal Poriyal, Curd & Appalam',
    },
    rich: {
      price: 260,
      items: ['Full Meals + 1 Starter', 'Chicken 65 / Gobi 65 Starter', 'Special Dum Biryani Cup', 'Sweet (Gulab Jamun)', 'Ice Cream Cup', 'Appalam & Pickle'],
      description: 'Grand Royal Feast: Full Meals + 1 crispy Starter, Sweet, Biryani sampler & Ice Cream',
    },
  },
  dinner: {
    lite: {
      price: 140,
      items: ['Chapathi (2)', 'Malabar Parotta (2)', 'Veg Kurma / Chicken Salna', 'Plain Dosa', 'Coconut Chutney'],
      description: 'Hot Parotta / Chapathi tiffin served with delicious Salna / Kurma and Chutney',
    },
    rich: {
      price: 240,
      items: ['Malabar Coin Parotta / Butter Naan', 'Butter Chicken / Paneer Masala', 'Fried Rice / Biryani', '1 Starter (Chukka / Manchurian)', 'Sweet'],
      description: 'Rich Night Dinner: choice of Naan/Parotta, rich gravy, Fried Rice/Biryani and starter',
    },
  },
};

const PRESET_CHIPS = {
  breakfast: ['Idly (2)', 'Crispy Dosa', 'Medu Vada (1)', 'Poori Masala', 'Ghee Pongal', 'Sweet Kesari', 'Filter Coffee', 'Hot Tea', 'Bread Omelette'],
  lunch: ['Full Meals', '1 Starter (Chicken 65)', '1 Starter (Gobi 65)', '1 Starter (Paneer Tikka)', 'Dum Biryani Cup', 'Curd Rice', 'Sweet (Jamun)', 'Ice Cream Cup', 'Fish Fry'],
  dinner: ['Parotta (2)', 'Chapathi (2)', 'Chicken Salna', 'Veg Kurma', 'Fried Rice', 'Biryani Cup', '1 Starter (Chicken Chukka)', 'Butter Naan', 'Paneer Butter Masala'],
};

interface RestaurantFormData {
  name: string;
  partnerCode: string;
  category: 'food';
  type: PartnerType;
  location: string;
  subLocation: string;
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
    menuDetails?: IMealMenuInclusions;
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
  location: 'Munnar',
  subLocation: 'Munnar Town',
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
    menuDetails: DEFAULT_MENU_DETAILS,
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

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRestaurant, setEditingRestaurant] = useState<IPartnerTieup | null>(null);
  const [formData, setFormData] = useState<RestaurantFormData>(emptyRestaurantForm);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [destinationsList, setDestinationsList] = useState<IDestination[]>([]);

  useEffect(() => {
    getDestinations().then((res) => {
      if (res?.success) {
        setDestinationsList(res.destinations || []);
      }
    });
  }, []);

  // Menu Card details modal & Form tier active tab
  const [selectedMenuRestaurant, setSelectedMenuRestaurant] = useState<IPartnerTieup | null>(null);
  const [activeMenuTierTab, setActiveMenuTierTab] = useState<'rich' | 'lite'>('rich');
  const [customDishInputs, setCustomDishInputs] = useState<{
    breakfast: string;
    lunch: string;
    dinner: string;
  }>({
    breakfast: '',
    lunch: '',
    dinner: '',
  });

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
    const defDest = destinationsList[0]?.name || 'Munnar';
    const defSub = destinationsList[0]?.subLocations?.[0] || 'Munnar Town';
    setFormData({
      ...emptyRestaurantForm,
      location: defDest,
      subLocation: defSub,
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
      location: restaurant.location || 'Munnar',
      subLocation: restaurant.subLocation || '',
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
        menuDetails: {
          breakfast: {
            lite: restaurant.mealPricing?.menuDetails?.breakfast?.lite || DEFAULT_MENU_DETAILS.breakfast?.lite,
            rich: restaurant.mealPricing?.menuDetails?.breakfast?.rich || DEFAULT_MENU_DETAILS.breakfast?.rich,
          },
          lunch: {
            lite: restaurant.mealPricing?.menuDetails?.lunch?.lite || DEFAULT_MENU_DETAILS.lunch?.lite,
            rich: restaurant.mealPricing?.menuDetails?.lunch?.rich || DEFAULT_MENU_DETAILS.lunch?.rich,
          },
          dinner: {
            lite: restaurant.mealPricing?.menuDetails?.dinner?.lite || DEFAULT_MENU_DETAILS.dinner?.lite,
            rich: restaurant.mealPricing?.menuDetails?.dinner?.rich || DEFAULT_MENU_DETAILS.dinner?.rich,
          },
        },
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

  const handleTogglePresetItem = (meal: 'breakfast' | 'lunch' | 'dinner', tier: 'lite' | 'rich', item: string) => {
    const currentMenu = formData.mealPricing.menuDetails || DEFAULT_MENU_DETAILS;
    const tierData = currentMenu[meal]?.[tier] || { items: [], price: 0, description: '' };
    const exists = tierData.items.includes(item);
    const updatedItems = exists
      ? tierData.items.filter((i) => i !== item)
      : [...tierData.items, item];

    setFormData({
      ...formData,
      mealPricing: {
        ...formData.mealPricing,
        menuDetails: {
          ...currentMenu,
          [meal]: {
            ...currentMenu[meal],
            [tier]: {
              ...tierData,
              items: updatedItems,
            },
          },
        },
      },
    });
  };

  const handleAddCustomDish = (meal: 'breakfast' | 'lunch' | 'dinner', tier: 'lite' | 'rich') => {
    const text = (customDishInputs[meal] || '').trim();
    if (!text) return;
    const currentMenu = formData.mealPricing.menuDetails || DEFAULT_MENU_DETAILS;
    const tierData = currentMenu[meal]?.[tier] || { items: [], price: 0, description: '' };
    if (!tierData.items.includes(text)) {
      setFormData({
        ...formData,
        mealPricing: {
          ...formData.mealPricing,
          menuDetails: {
            ...currentMenu,
            [meal]: {
              ...currentMenu[meal],
              [tier]: {
                ...tierData,
                items: [...tierData.items, text],
              },
            },
          },
        },
      });
    }
    setCustomDishInputs((prev) => ({ ...prev, [meal]: '' }));
  };

  const handleRemoveItem = (meal: 'breakfast' | 'lunch' | 'dinner', tier: 'lite' | 'rich', indexToRemove: number) => {
    const currentMenu = formData.mealPricing.menuDetails || DEFAULT_MENU_DETAILS;
    const tierData = currentMenu[meal]?.[tier] || { items: [], price: 0, description: '' };
    const updatedItems = tierData.items.filter((_, idx) => idx !== indexToRemove);
    setFormData({
      ...formData,
      mealPricing: {
        ...formData.mealPricing,
        menuDetails: {
          ...currentMenu,
          [meal]: {
            ...currentMenu[meal],
            [tier]: {
              ...tierData,
              items: updatedItems,
            },
          },
        },
      },
    });
  };

  const handleUpdateTierPrice = (meal: 'breakfast' | 'lunch' | 'dinner', tier: 'lite' | 'rich', price: number) => {
    const currentMenu = formData.mealPricing.menuDetails || DEFAULT_MENU_DETAILS;
    const tierData = currentMenu[meal]?.[tier] || { items: [], price: 0, description: '' };
    setFormData({
      ...formData,
      mealPricing: {
        ...formData.mealPricing,
        [meal]: tier === 'rich' ? price : formData.mealPricing[meal],
        menuDetails: {
          ...currentMenu,
          [meal]: {
            ...currentMenu[meal],
            [tier]: {
              ...tierData,
              price,
            },
          },
        },
      },
    });
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

  const handleCopyMenuToClipboard = (restaurant: IPartnerTieup) => {
    const menu = restaurant.mealPricing?.menuDetails || DEFAULT_MENU_DETAILS;
    const text = `🍽️ *${restaurant.name} - ${restaurant.location}*
📞 Contact: ${restaurant.phone} (${restaurant.contactPerson || 'Manager'})
🌱 Food Type: ${restaurant.foodType === 'veg' ? 'Pure Veg' : restaurant.foodType === 'non_veg' ? 'Non-Veg' : 'Veg & Non-Veg'}

✨ *RICH / SPECIAL MENU (Meals + 1 Starter)*:
☕ Breakfast (₹${menu.breakfast?.rich?.price || restaurant.mealPricing?.breakfast || 160}):
   ${(menu.breakfast?.rich?.items || []).join(', ')}

🍲 Lunch (₹${menu.lunch?.rich?.price || restaurant.mealPricing?.lunch || 260}):
   ${(menu.lunch?.rich?.items || []).join(', ')}

🌙 Dinner (₹${menu.dinner?.rich?.price || restaurant.mealPricing?.dinner || 240}):
   ${(menu.dinner?.rich?.items || []).join(', ')}

🌿 *LITE / STANDARD MENU*:
☕ Breakfast (₹${menu.breakfast?.lite?.price || 100}): ${(menu.breakfast?.lite?.items || []).join(', ')}
🍲 Lunch (₹${menu.lunch?.lite?.price || 160}): ${(menu.lunch?.lite?.items || []).join(', ')}
🌙 Dinner (₹${menu.dinner?.lite?.price || 140}): ${(menu.dinner?.lite?.items || []).join(', ')}

✅ Hills Angels Tourist Food Arrangement`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success('Food Menu copied to clipboard! Ready to paste in WhatsApp.');
    } else {
      toast.error('Clipboard access not supported');
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
                        <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>{restaurant.subLocation ? `${restaurant.subLocation}, ${restaurant.location}` : restaurant.location}</span>
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
                      {(() => {
                        const menu = restaurant.mealPricing?.menuDetails || DEFAULT_MENU_DETAILS;
                        const bfItems = (menu.breakfast?.rich?.items || menu.breakfast?.lite?.items || ['Idly', 'Dosa']).slice(0, 3).join(', ');
                        const hasStarter = (menu.lunch?.rich?.items || []).some((i) =>
                          i.toLowerCase().includes('starter')
                        );
                        const lunchHighlight = hasStarter
                          ? 'Full Meals + 1 Starter'
                          : (menu.lunch?.rich?.items || ['Full Meals']).slice(0, 2).join(', ');
                        const dinnerItems = (menu.dinner?.rich?.items || menu.dinner?.lite?.items || ['Parotta', 'Chapathi']).slice(0, 2).join(', ');

                        return (
                          <div className="space-y-1.5 max-w-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                                BF: {formatINR(restaurant.mealPricing?.breakfast || 120)}
                              </span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                                Lunch: {formatINR(restaurant.mealPricing?.lunch || 220)}
                              </span>
                              <span className="text-[10px] bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded font-bold border border-indigo-200">
                                Din: {formatINR(restaurant.mealPricing?.dinner || 200)}
                              </span>
                            </div>

                            <div className="text-[10.5px] bg-gray-50/90 p-1.5 rounded-lg border border-gray-100 space-y-0.5 text-gray-600">
                              <div className="truncate">
                                <span className="font-semibold text-gray-800">☕ BF:</span> {bfItems}...
                              </div>
                              <div className="truncate flex items-center gap-1">
                                <span className="font-semibold text-emerald-800 shrink-0">🍲 Lunch:</span>
                                <span className="bg-emerald-100 text-emerald-900 font-bold px-1 rounded text-[9.5px]">
                                  {lunchHighlight}
                                </span>
                              </div>
                              <div className="truncate">
                                <span className="font-semibold text-indigo-700">🌙 Din:</span> {dinnerItems}...
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedMenuRestaurant(restaurant)}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                            >
                              <UtensilsCrossed className="w-3 h-3" />
                              <span>View Lite & Rich Menu Card</span>
                            </button>
                          </div>
                        );
                      })()}
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

                  {/* Meal Rates & Menu Inclusions */}
                  {(() => {
                    const menu = restaurant.mealPricing?.menuDetails || DEFAULT_MENU_DETAILS;
                    const hasStarter = (menu.lunch?.rich?.items || []).some((i) =>
                      i.toLowerCase().includes('starter')
                    );
                    return (
                      <div className="space-y-2">
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

                        {/* Rich Food Menu Inclusions Preview */}
                        <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-50/70 to-rose-50/50 border border-amber-200/60 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-600" /> Rich Menu Special
                            </span>
                            <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              {hasStarter ? 'Full Meals + 1 Starter' : 'Grand Feast'}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-600 space-y-0.5">
                            <p className="truncate">
                              <b>☕ BF:</b> {(menu.breakfast?.rich?.items || ['Idly', 'Dosa', 'Vada']).slice(0, 3).join(', ')}...
                            </p>
                            <p className="truncate text-emerald-900 font-medium">
                              <b>🍲 Lunch:</b> {hasStarter ? 'Full Meals + 1 Starter (Chicken/Gobi 65)' : 'Special Full Meals'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMenuRestaurant(restaurant)}
                            className="w-full py-1 rounded-lg bg-white border border-amber-200 text-[10px] font-bold text-amber-900 hover:bg-amber-100/50 flex items-center justify-center gap-1 transition-colors shadow-2xs"
                          >
                            <FileText className="w-3 h-3 text-amber-700" />
                            <span>View Lite vs Rich Menu</span>
                          </button>
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
                    );
                  })()}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-xs">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {editingRestaurant ? `Edit ${editingRestaurant.name}` : 'Register New Restaurant / Food Spot'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Save dining rates and exact breakfast, lunch, and dinner food inclusions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-7 overflow-y-auto flex-1 space-y-5">
              {/* Photo Upload & Preview */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="relative group shrink-0">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Restaurant"
                      style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }}
                      className="rounded-2xl object-cover border border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div
                      style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }}
                      className="rounded-2xl bg-rose-50 text-rose-600 flex flex-col items-center justify-center border border-rose-100"
                    >
                      <UtensilsCrossed className="w-8 h-8" />
                      <span className="text-xs font-bold mt-1">Photo</span>
                    </div>
                  )}

                  <label
                    htmlFor="restaurant-photo-input"
                    className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-xs font-bold"
                  >
                    <Camera className="w-5 h-5 mb-1" />
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

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">Restaurant Photo</span>
                    {uploadingPhoto && (
                      <span className="text-xs text-rose-600 flex items-center gap-1 font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading image...
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Paste image URL (or click photo icon to upload file)"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Name & Dining Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Restaurant / Spot Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Nilgiri Traditional Banana Leaf Mess"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Dining Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  >
                    {DINING_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Destination & Sub-Location (Place/Area) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-rose-50/40 border border-rose-100">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Destination (Hill Station) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => {
                      const newLoc = e.target.value;
                      const matched = destinationsList.find((d) => d.name.toLowerCase() === newLoc.toLowerCase());
                      setFormData((prev) => ({
                        ...prev,
                        location: newLoc,
                        subLocation: matched?.subLocations?.[0] || '',
                      }));
                    }}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  >
                    {destinationsList.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({d.state})
                      </option>
                    ))}
                    {!destinationsList.some((d) => d.name.toLowerCase() === formData.location.toLowerCase()) && (
                      <option value={formData.location}>{formData.location}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Specific Place / Area (in {formData.location})
                  </label>
                  <select
                    value={formData.subLocation}
                    onChange={(e) => setFormData({ ...formData, subLocation: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                  >
                    <option value="">-- Choose Place / Area --</option>
                    {(destinationsList.find((d) => d.name.toLowerCase() === formData.location.toLowerCase())?.subLocations || []).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.subLocation}
                    onChange={(e) => setFormData({ ...formData, subLocation: e.target.value })}
                    placeholder="Or type custom place (e.g. Kanthaloor Village)"
                    className="w-full mt-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Cuisine Specialty & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Cuisine Specialty
                  </label>
                  <select
                    value={formData.foodType}
                    onChange={(e) => setFormData({ ...formData, foodType: e.target.value as any })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  >
                    <option value="all">Veg & Non-Veg (Multi-Cuisine)</option>
                    <option value="veg">Pure Veg Only (Brahmin / Jain / South Indian)</option>
                    <option value="non_veg">Non-Veg Specialty (Chettinad / Malabar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Restaurant Address & Landmark
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Near Post Office Junction, Munnar Town"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Meal Pricing & Menu Inclusions Builder */}
              <div className="p-5 bg-gradient-to-b from-rose-50/80 via-amber-50/30 to-white rounded-3xl border-2 border-rose-200/80 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/70 pb-3">
                  <div>
                    <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-rose-600" />
                      Per Head Meal Pricing & Food Inclusions
                    </span>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                      Specify exact food items for breakfast, lunch & dinner (e.g. Idly, Dosa, Full Meals + 1 Starter)
                    </p>
                  </div>

                  {/* Lite vs Rich Tier Tab */}
                  <div className="flex items-center bg-gray-200/80 p-1 rounded-2xl border border-gray-300 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveMenuTierTab('rich')}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                        activeMenuTierTab === 'rich'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>✨ Rich Menu (Meals + Starter)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMenuTierTab('lite')}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                        activeMenuTierTab === 'lite'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <span>🌿 Lite Menu (Budget)</span>
                    </button>
                  </div>
                </div>

                {/* Rates Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
                      Breakfast ₹
                    </label>
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
                      className="w-full px-3 py-1.5 text-base font-extrabold rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-900"
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
                      Lunch ₹
                    </label>
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
                      className="w-full px-3 py-1.5 text-base font-extrabold rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-900"
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
                      Dinner ₹
                    </label>
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
                      className="w-full px-3 py-1.5 text-base font-extrabold rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-gray-900"
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border-2 border-rose-200 shadow-2xs">
                    <label className="block text-xs sm:text-sm font-bold text-rose-800 mb-1">
                      Full Day Combo ₹
                    </label>
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
                      className="w-full px-3 py-1.5 text-base font-extrabold rounded-lg border border-rose-200 bg-rose-50/50 focus:bg-white text-rose-700"
                    />
                  </div>
                </div>

                {/* 3 Meals Inclusions Config (Breakfast, Lunch, Dinner) */}
                <div className="space-y-4 pt-1">
                  {(['breakfast', 'lunch', 'dinner'] as const).map((mealKey) => {
                    const currentMenu = formData.mealPricing.menuDetails || DEFAULT_MENU_DETAILS;
                    const tierData = currentMenu[mealKey]?.[activeMenuTierTab] || {
                      items: [],
                      price: 0,
                      description: '',
                    };
                    const mealTitle =
                      mealKey === 'breakfast'
                        ? '☕ Breakfast Inclusions'
                        : mealKey === 'lunch'
                        ? '🍲 Lunch Inclusions (Full Meals & Starters)'
                        : '🌙 Dinner Inclusions';

                    return (
                      <div
                        key={mealKey}
                        className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                          activeMenuTierTab === 'rich'
                            ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                            : 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/60 pb-2">
                          <span className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                            {mealTitle}
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-lg uppercase tracking-wider font-extrabold ${
                                activeMenuTierTab === 'rich'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              }`}
                            >
                              {activeMenuTierTab === 'rich' ? 'Rich / Executive' : 'Lite / Regular'}
                            </span>
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-gray-600 font-bold">Price:</span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">
                                ₹
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={tierData.price || 0}
                                onChange={(e) =>
                                  handleUpdateTierPrice(mealKey, activeMenuTierTab, Number(e.target.value))
                                }
                                className="w-24 pl-6 pr-2 py-1.5 text-sm rounded-xl border border-gray-300 bg-white font-extrabold text-gray-900"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Selected Food Badges */}
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-gray-700 block mb-1.5">
                            Included Items in {mealKey}:
                          </span>
                          <div className="flex flex-wrap gap-2 min-h-[34px]">
                            {tierData.items.map((item, idx) => (
                              <span
                                key={idx}
                                className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border shadow-2xs ${
                                  activeMenuTierTab === 'rich'
                                    ? item.toLowerCase().includes('starter')
                                      ? 'bg-rose-100 text-rose-950 border-rose-300 font-bold ring-1 ring-rose-400/40'
                                      : 'bg-white text-gray-900 border-amber-300'
                                    : 'bg-white text-gray-900 border-emerald-300'
                                }`}
                              >
                                <span>{item}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(mealKey, activeMenuTierTab, idx)}
                                  className="text-gray-400 hover:text-rose-600 transition-colors ml-0.5"
                                  title="Remove item"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                            {tierData.items.length === 0 && (
                              <span className="text-xs text-gray-400 italic">
                                No dishes added yet. Click presets below or type custom dish.
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Preset Chips Quick Add */}
                        <div className="pt-1 border-t border-gray-200/50">
                          <span className="text-xs font-bold text-gray-500 block mb-1.5">
                            Quick Tap to Add:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_CHIPS[mealKey].map((chip) => {
                              const isAdded = tierData.items.includes(chip);
                              return (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => handleTogglePresetItem(mealKey, activeMenuTierTab, chip)}
                                  className={`text-xs sm:text-sm px-3 py-1 rounded-xl font-medium border transition-all flex items-center gap-1 ${
                                    isAdded
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-bold'
                                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                  }`}
                                >
                                  {isAdded ? <Check className="w-3.5 h-3.5" /> : '+'}
                                  <span>{chip}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Dish Input */}
                        <div className="flex items-center gap-2 pt-1.5">
                          <input
                            type="text"
                            value={customDishInputs[mealKey]}
                            onChange={(e) =>
                              setCustomDishInputs((prev) => ({ ...prev, [mealKey]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomDish(mealKey, activeMenuTierTab);
                              }
                            }}
                            placeholder={`Type custom dish (e.g. ${
                              mealKey === 'breakfast'
                                ? 'Appam, Ghee Roast'
                                : mealKey === 'lunch'
                                ? 'Full Meals + 1 Starter, Fish Curry'
                                : 'Coin Parotta, Kada Fry'
                            })`}
                            className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomDish(mealKey, activeMenuTierTab)}
                            className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-2xs"
                          >
                            + Add Dish
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seating Capacity & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Full Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Commercial Road, Near Charring Cross, Ooty"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Manager & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Manager / Cashier Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Anand (Manager)"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98421 99001"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">
                  Menu Notes & Group Catering Terms
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Special banana leaf buffet with 12 items. Parking for 2 Tempo Travellers."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingPhoto}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 transition-all active:scale-98"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingRestaurant ? 'Update Restaurant' : 'Save to Master'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. RESTAURANT MENU CARD MODAL (Lite & Rich comparison) */}
      {selectedMenuRestaurant && (() => {
        const r = selectedMenuRestaurant;
        const menu = r.mealPricing?.menuDetails || DEFAULT_MENU_DETAILS;
        const richBf = menu.breakfast?.rich?.price || r.mealPricing?.breakfast || 160;
        const richLunch = menu.lunch?.rich?.price || r.mealPricing?.lunch || 260;
        const richDinner = menu.dinner?.rich?.price || r.mealPricing?.dinner || 240;
        const richFullDay = richBf + richLunch + richDinner;

        const liteBf = menu.breakfast?.lite?.price || 100;
        const liteLunch = menu.lunch?.lite?.price || 160;
        const liteDinner = menu.dinner?.lite?.price || 140;
        const liteFullDay = liteBf + liteLunch + liteDinner;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-rose-50 via-amber-50/60 to-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">{r.name}</h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                          r.foodType === 'veg'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : r.foodType === 'non_veg'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {r.foodType === 'veg' ? '🌱 Pure Veg' : r.foodType === 'non_veg' ? '🍗 Non-Veg' : 'Veg & Non-Veg'}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" /> {r.location}
                      </span>
                      <span>•</span>
                      <span>Seating: {r.capacity || 40} seats</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMenuRestaurant(null)}
                  className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Card Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Visual Banner */}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Curated Meal Inclusions</h4>
                      <p className="text-xs text-gray-600">
                        Compare between <b>Lite (Budget / Standard)</b> and <b>Rich (Executive Feast with Starter)</b>.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyMenuToClipboard(r)}
                    className="px-4 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded-xl text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-2 shadow-xs transition-all active:scale-98 shrink-0"
                  >
                    <Copy className="w-4 h-4 text-rose-600" />
                    <span>Copy for WhatsApp</span>
                  </button>
                </div>

                {/* 2 Column Comparison: Rich Plan vs Lite Plan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column 1: Rich Plan (Feast) */}
                  <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/30 p-4 space-y-3.5 relative overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                      <div>
                        <span className="text-xs uppercase font-extrabold text-amber-800 tracking-wider block">
                          Executive Package
                        </span>
                        <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5 mt-0.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Rich Menu Plan
                        </h3>
                      </div>
                      <span className="text-sm font-black text-amber-950 bg-amber-200/80 px-3 py-1 rounded-xl">
                        {formatINR(richFullDay)} / day
                      </span>
                    </div>

                    {/* Breakfast Rich */}
                    <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900 flex items-center gap-1">
                          ☕ Breakfast
                        </span>
                        <span className="text-sm font-extrabold text-amber-800">{formatINR(richBf)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(menu.breakfast?.rich?.items || []).map((dish, i) => (
                          <span
                            key={i}
                            className="text-xs font-semibold bg-amber-50 text-amber-950 px-2.5 py-1 rounded-lg border border-amber-200"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Lunch Rich */}
                    <div className="bg-white p-3.5 rounded-xl border-2 border-amber-400 shadow-2xs space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-emerald-950 flex items-center gap-1">
                          🍲 Lunch (Special Meals)
                        </span>
                        <span className="text-sm font-extrabold text-rose-700">{formatINR(richLunch)}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Included: Full Meals + 1 Starter (Chicken 65 / Gobi 65)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {(menu.lunch?.rich?.items || []).map((dish, i) => (
                          <span
                            key={i}
                            className="text-xs font-semibold bg-amber-50 text-amber-950 px-2.5 py-1 rounded-lg border border-amber-200"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Dinner Rich */}
                    <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-indigo-950 flex items-center gap-1">
                          🌙 Dinner Combo
                        </span>
                        <span className="text-sm font-extrabold text-indigo-900">{formatINR(richDinner)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(menu.dinner?.rich?.items || []).map((dish, i) => (
                          <span
                            key={i}
                            className="text-xs font-semibold bg-indigo-50 text-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Lite Plan (Standard) */}
                  <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/20 p-4 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                      <div>
                        <span className="text-xs uppercase font-extrabold text-emerald-800 tracking-wider block">
                          Budget Package
                        </span>
                        <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5 mt-0.5">
                          🌿 Lite Menu Plan
                        </h3>
                      </div>
                      <span className="text-sm font-black text-emerald-950 bg-emerald-200/80 px-3 py-1 rounded-xl">
                        {formatINR(liteFullDay)} / day
                      </span>
                    </div>

                    {/* Breakfast Lite */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">☕ Breakfast</span>
                        <span className="text-sm font-extrabold text-gray-800">{formatINR(liteBf)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(menu.breakfast?.lite?.items || []).map((dish, i) => (
                          <span
                            key={i}
                            className="text-xs font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Lunch Lite */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">🍲 Lunch (Standard Meals)</span>
                        <span className="text-sm font-extrabold text-gray-800">{formatINR(liteLunch)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(menu.lunch?.lite?.items || []).map((dish, i) => (
                          <span
                            key={i}
                            className="text-xs font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Dinner Lite */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">🌙 Dinner (Light Tiffin)</span>
                        <span className="text-sm font-extrabold text-gray-800">{formatINR(liteDinner)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(menu.dinner?.lite?.items || []).map((dish, i) => (
                          <span
                            key={i}
                            className="text-xs font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manager & Direct Contact bar */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-500 font-semibold">Contact Person:</span>{' '}
                    <b className="text-gray-900">{r.contactPerson || 'Caretaker / Cashier'}</b>
                    {r.address && <span className="text-gray-500 block text-xs mt-0.5">{r.address}</span>}
                  </div>
                  <a
                    href={`tel:${r.phone}`}
                    className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all shadow-xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call {r.phone}</span>
                  </a>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedMenuRestaurant(null);
                    handleOpenEdit(r);
                  }}
                  className="text-sm font-bold text-rose-700 hover:underline flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit This Menu In Master</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCopyMenuToClipboard(r)}
                    className="px-4 py-2 border border-gray-300 text-gray-800 text-sm font-bold rounded-xl hover:bg-white flex items-center gap-2 shadow-2xs"
                  >
                    <Copy className="w-4 h-4 text-rose-600" />
                    <span>Copy Menu</span>
                  </button>
                  <button
                    onClick={() => setSelectedMenuRestaurant(null)}
                    className="px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
