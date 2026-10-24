import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  IndianRupee,
  Phone,
  MessageCircle,
  MapPin,
  Star,
  Users,
  BedDouble,
  CheckCircle2,
  XCircle,
  Calculator,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Layers,
  FileText,
  Info,
  Coffee,
  Flame,
  Wifi,
  Car,
  Copy,
  Check,
  Percent,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getPartners,
  getPartnerStats,
  createPartner,
  updatePartner,
  deletePartner,
  calculateTripSettlement,
} from '../../api/partners';
import {
  IPartnerTieup,
  IPartnerStats,
  PartnerCategory,
  PartnerType,
  PricingModel,
  FoodType,
  ISettlementCalculation,
} from '../../types';
import { formatINR } from '../../utils/formatters';

interface PartnerFormData {
  name: string;
  partnerCode: string;
  category: PartnerCategory;
  type: PartnerType;
  location: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  pricingModel: PricingModel;
  pricePerPerson: number;
  pricePerTrip: number;
  pricePerRoom: number;
  mealPricing: {
    breakfast: number;
    lunch: number;
    dinner: number;
    fullDay: number;
  };
  capacity: number;
  maxGuestsPerRoom: number;
  foodType: FoodType;
  amenities: string[];
  paymentTerms: string;
  rating: number;
  status: 'active' | 'inactive';
  imageUrl: string;
  notes: string;
}

const initialFormState: PartnerFormData = {
  name: '',
  partnerCode: '',
  category: 'stay',
  type: 'cottage',
  location: 'Munnar',
  address: '',
  contactPerson: '',
  phone: '',
  email: '',
  pricingModel: 'per_person',
  pricePerPerson: 750,
  pricePerTrip: 4500,
  pricePerRoom: 2400,
  mealPricing: {
    breakfast: 90,
    lunch: 140,
    dinner: 140,
    fullDay: 350,
  },
  capacity: 10,
  maxGuestsPerRoom: 3,
  foodType: 'all',
  amenities: ['Campfire with Music', 'Hot Water 24/7', 'Mountain View', 'Driver Restroom'],
  paymentTerms: 'Settlement per trip completion',
  rating: 4.8,
  status: 'active',
  imageUrl: '',
  notes: '',
};

const COMMON_STAY_AMENITIES = [
  'Campfire with Music',
  'Hot Water 24/7',
  'Mountain Valley View',
  'Driver Restroom',
  'Free Wi-Fi',
  'Kitchen Access',
  'BBQ Pit',
  'Lawn / Garden',
  'Covered Parking',
  'Caretaker On-site',
];

const COMMON_FOOD_AMENITIES = [
  'Kerala Meals / Thali',
  'Pure Veg Section',
  'Packed Lunch for Safari',
  'Quick Group Serving',
  'Live Barbeque & Campfire',
  'Banana Leaf Meals',
  'Trek Snack Box',
  'Clean Restrooms',
  'Special Tea / Filter Coffee',
];

export default function AdminPartners(): React.ReactElement {
  const [partners, setPartners] = useState<IPartnerTieup[]>([]);
  const [stats, setStats] = useState<IPartnerStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'stay' | 'food'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPartner, setEditingPartner] = useState<IPartnerTieup | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<PartnerFormData>(initialFormState);
  const [customAmenityInput, setCustomAmenityInput] = useState<string>('');

  // Trip Cost Estimator state (for Stay & Food vendor payouts)
  const [calculatorOpen, setCalculatorOpen] = useState<boolean>(false);
  const [calcPersons, setCalcPersons] = useState<number>(6);
  const [calcNights, setCalcNights] = useState<number>(1);
  const [calcDays, setCalcDays] = useState<number>(2);
  const [selectedStayId, setSelectedStayId] = useState<string>('');
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [settlementResult, setSettlementResult] = useState<ISettlementCalculation | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);

  // Fetch all data
  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [partnersRes, statsRes] = await Promise.all([
        getPartners({
          category: categoryFilter,
          location: locationFilter,
          status: statusFilter,
          search,
        }),
        getPartnerStats(),
      ]);

      if (partnersRes.success) {
        setPartners(partnersRes.partners || []);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err: any) {
      toast.error('Failed to load partner tie-ups data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter, locationFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Available stays & foods for calculator dropdown
  const stayPartners = useMemo(
    () => partners.filter((p) => p.category === 'stay' && p.status === 'active'),
    [partners]
  );
  const foodPartners = useMemo(
    () => partners.filter((p) => p.category === 'food' && p.status === 'active'),
    [partners]
  );

  // Set default selection for calculator once data loads
  useEffect(() => {
    if (!selectedStayId && stayPartners.length > 0) {
      setSelectedStayId(String(stayPartners[0].id || stayPartners[0]._id));
    }
    if (!selectedFoodId && foodPartners.length > 0) {
      setSelectedFoodId(String(foodPartners[0].id || foodPartners[0]._id));
    }
  }, [stayPartners, foodPartners]);

  // Run calculation whenever calculator inputs change
  useEffect(() => {
    const runCalculation = async () => {
      if (!selectedStayId && !selectedFoodId) return;
      try {
        setCalculating(true);
        const res = await calculateTripSettlement({
          stayPartnerId: selectedStayId ? Number(selectedStayId) : null,
          foodPartnerId: selectedFoodId ? Number(selectedFoodId) : null,
          persons: calcPersons,
          nights: calcNights,
          days: calcDays,
        });
        if (res.success) {
          setSettlementResult(res.data);
        }
      } catch (e) {
        console.error('Calculation error:', e);
      } finally {
        setCalculating(false);
      }
    };

    runCalculation();
  }, [selectedStayId, selectedFoodId, calcPersons, calcNights, calcDays]);

  const handleCopyVendorEstimate = () => {
    if (!settlementResult) return;
    const text = `🏔️ *HILLS ANGEL - VENDOR TIE-UP ESTIMATE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 *Guests:* ${calcPersons} Pax | 📅 *Duration:* ${calcDays}D / ${calcNights}N
🏡 *Stay Partner:* ${settlementResult.stay?.name || 'None'} - ${formatINR(settlementResult.stay?.totalCost || 0)}
🍽️ *Food Partner:* ${settlementResult.food?.name || 'None'} - ${formatINR(settlementResult.food?.totalCost || 0)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 *Total Vendor Payout:* ${formatINR(settlementResult.totalSettlement)}
Cost per person: ${formatINR(settlementResult.totalPerPerson)} / pax
_Generated via Hills Angel Admin Console_`;

    navigator.clipboard.writeText(text);
    toast.success('Vendor estimate copied to clipboard!');
  };

  // Handle open add modal
  const handleOpenAddModal = () => {
    setEditingPartner(null);
    setFormData({
      ...initialFormState,
      partnerCode: `COT-${Math.floor(100 + Math.random() * 900)}`,
    });
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (partner: IPartnerTieup) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      partnerCode: partner.partnerCode,
      category: partner.category,
      type: partner.type,
      location: partner.location || 'Munnar',
      address: partner.address || '',
      contactPerson: partner.contactPerson || '',
      phone: partner.phone || '',
      email: partner.email || '',
      pricingModel: partner.pricingModel,
      pricePerPerson: partner.pricePerPerson || 0,
      pricePerTrip: partner.pricePerTrip || 0,
      pricePerRoom: partner.pricePerRoom || 0,
      mealPricing: {
        breakfast: partner.mealPricing?.breakfast || 0,
        lunch: partner.mealPricing?.lunch || 0,
        dinner: partner.mealPricing?.dinner || 0,
        fullDay: partner.mealPricing?.fullDay || 0,
      },
      capacity: partner.capacity || 10,
      maxGuestsPerRoom: partner.maxGuestsPerRoom || 2,
      foodType: partner.foodType || 'all',
      amenities: Array.isArray(partner.amenities) ? partner.amenities : [],
      paymentTerms: partner.paymentTerms || '',
      rating: partner.rating || 4.8,
      status: partner.status,
      imageUrl: partner.imageUrl || '',
      notes: partner.notes || '',
    });
    setIsModalOpen(true);
  };

  // Toggle active/inactive quickly
  const handleToggleStatus = async (partner: IPartnerTieup) => {
    const newStatus = partner.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await updatePartner(partner.id || partner._id!, { status: newStatus });
      if (res.success) {
        toast.success(`${partner.name} status updated to ${newStatus}`);
        setPartners((prev) =>
          prev.map((p) => (p.id === partner.id ? { ...p, status: newStatus } : p))
        );
        fetchData();
      }
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Partner name and phone number are required');
      return;
    }

    try {
      setSaving(true);
      if (editingPartner) {
        const partnerId = editingPartner.id || editingPartner._id!;
        const res = await updatePartner(partnerId, formData);
        if (res.success) {
          toast.success('Partner tie-up updated successfully!');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await createPartner(formData);
        if (res.success) {
          toast.success('New partner tie-up added successfully!');
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving partner tie-up');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await deletePartner(deleteConfirmId);
      if (res.success) {
        toast.success('Partner tie-up removed successfully');
        setDeleteConfirmId(null);
        fetchData();
      }
    } catch (err: any) {
      toast.error('Failed to delete partner tie-up');
    }
  };

  // Toggle amenity selection in form
  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const addCustomAmenity = () => {
    if (!customAmenityInput.trim()) return;
    if (!formData.amenities.includes(customAmenityInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, customAmenityInput.trim()],
      }));
    }
    setCustomAmenityInput('');
  };

  // Auto-switch category based on type selection
  const handleTypeChange = (newType: PartnerType) => {
    const isStay = ['cottage', 'hotel', 'resort', 'homestay'].includes(newType);
    const newCategory: PartnerCategory = isStay ? 'stay' : 'food';
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: newCategory,
      pricingModel: isStay ? prev.pricingModel : 'per_person',
    }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ================= 1. HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#192D20]">
              Cottage, Hotel & Food Tie-ups (ஹோட்டல் & உணவக ஒப்பந்தங்கள்)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Directory of partner cottages, hotels, resorts & restaurant tie-ups with rates per trip, per person, per room, and meal plans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/company-partners"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs sm:text-sm font-semibold transition-all shadow-xs"
          >
            <Users className="w-4 h-4 text-amber-700" />
            <span>Company Partners & Profit</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#192D20] text-white hover:bg-[#25422F] text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Tie-up</span>
          </button>
        </div>
      </div>

      {/* ================= 2. KPI METRICS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Tie-ups */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Total Tie-ups
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#192D20] mt-1 block">
              {stats?.totalCount ?? partners.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">
              {stats?.activeCount ?? 0} Active contracts
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Stay Tie-ups */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Cottages & Hotels
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#192D20] mt-1 block">
              {stats?.stayCount ?? 0}
            </span>
            <span className="text-[11px] text-gray-500">
              Avg {formatINR(stats?.avgStayPerPerson ?? 0)}/person
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BedDouble className="w-5 h-5" />
          </div>
        </div>

        {/* Food Tie-ups */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Food & Restaurants
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#192D20] mt-1 block">
              {stats?.foodCount ?? 0}
            </span>
            <span className="text-[11px] text-gray-500">
              Avg {formatINR(stats?.avgFoodPerPerson ?? 0)}/head
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
        </div>

        {/* Avg Room Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Avg Stay / Room
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#192D20] mt-1 block">
              {formatINR(stats?.avgStayPerRoom ?? 2500)}
            </span>
            <span className="text-[11px] text-gray-500">per room / night</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ================= 3. INTERACTIVE TRIP SETTLEMENT & PROFIT ESTIMATOR ================= */}
      <div className="bg-gradient-to-br from-[#192D20] via-[#1E3626] to-[#142419] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-emerald-900/40">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-white">
                Trip Vendor Settlement & Cost Estimator
              </h2>
              <p className="text-xs text-gray-300">
                Calculate total payout to Stay & Food partners for a trip based on persons & nights
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCalculatorOpen(!calculatorOpen)}
            className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span>{calculatorOpen ? 'Collapse' : 'Expand Estimator'}</span>
            {calculatorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {calculatorOpen && (
          <div className="mt-5 space-y-5">
            {/* Input Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Stay Partner Picker */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                  Stay Partner (Cottage/Hotel)
                </label>
                <select
                  value={selectedStayId}
                  onChange={(e) => setSelectedStayId(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                >
                  <option value="" className="text-gray-900">
                    -- No Stay (Day Trip) --
                  </option>
                  {stayPartners.map((stay) => (
                    <option
                      key={stay.id || stay._id}
                      value={String(stay.id || stay._id)}
                      className="text-gray-900"
                    >
                      {stay.name} ({stay.type.toUpperCase()} • ₹
                      {stay.pricingModel === 'per_person'
                        ? `${stay.pricePerPerson}/head`
                        : stay.pricingModel === 'per_room'
                        ? `${stay.pricePerRoom}/room`
                        : `${stay.pricePerTrip}/trip`}
                      )
                    </option>
                  ))}
                </select>
              </div>

              {/* Food Partner Picker */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                  Food Partner (Restaurant/Mess)
                </label>
                <select
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                >
                  <option value="" className="text-gray-900">
                    -- No Food Included --
                  </option>
                  {foodPartners.map((food) => (
                    <option
                      key={food.id || food._id}
                      value={String(food.id || food._id)}
                      className="text-gray-900"
                    >
                      {food.name} ({food.type.toUpperCase()} • ₹
                      {food.pricingModel === 'per_trip'
                        ? `${food.pricePerTrip}/trip`
                        : `${food.pricePerPerson}/head/day`}
                      )
                    </option>
                  ))}
                </select>
              </div>

              {/* Persons Count */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                  No. of Persons
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={calcPersons}
                  onChange={(e) => setCalcPersons(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Nights Count */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                  Nights of Stay
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={calcNights}
                  onChange={(e) => setCalcNights(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Days Count */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                  Tour Days (For Food)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={calcDays}
                  onChange={(e) => setCalcDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Settlement Results Display */}
            {settlementResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-black/25 border border-white/10">
                {/* Stay Breakdown */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold block">
                    Stay Settlement
                  </span>
                  <p className="text-sm font-bold text-white mt-1 truncate">
                    {settlementResult.stay?.name || 'No Stay Selected'}
                  </p>
                  <p className="text-lg font-extrabold text-amber-300 mt-0.5">
                    {formatINR(settlementResult.stay?.totalCost || 0)}
                  </p>
                  <p className="text-[11px] text-gray-300">
                    ≈ {formatINR(settlementResult.stay?.costPerPerson || 0)} / person ({calcNights}N)
                  </p>
                </div>

                {/* Food Breakdown */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold block">
                    Food Settlement
                  </span>
                  <p className="text-sm font-bold text-white mt-1 truncate">
                    {settlementResult.food?.name || 'No Food Selected'}
                  </p>
                  <p className="text-lg font-extrabold text-emerald-300 mt-0.5">
                    {formatINR(settlementResult.food?.totalCost || 0)}
                  </p>
                  <p className="text-[11px] text-gray-300">
                    ≈ {formatINR(settlementResult.food?.costPerPerson || 0)} / person ({calcDays}D)
                  </p>
                </div>

                {/* Total Payout */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-400/30">
                  <span className="text-[11px] uppercase tracking-wider text-amber-200 font-bold block">
                    Total Vendor Payout
                  </span>
                  <p className="text-2xl font-black text-amber-400 mt-0.5">
                    {formatINR(settlementResult.totalSettlement)}
                  </p>
                  <p className="text-[11px] text-gray-200 mt-0.5">
                    Cost to Hills Angel:{' '}
                    <strong className="text-white">
                      {formatINR(settlementResult.totalPerPerson)}
                    </strong>{' '}
                    / person ({calcPersons} pax)
                  </p>
                </div>
              </div>
            )}

            {/* Vendor Estimate WhatsApp copy & Link to Company Partners */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyVendorEstimate}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Vendor Estimate Statement</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-300 hidden md:inline">
                  Deduct vendor bills and calculate net profit for Hills Angel partners:
                </span>
                <Link
                  to="/admin/company-partners"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold shadow-xs transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Company Partners & Net Profit Split &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. FILTER & SEARCH CONTROLS ================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === 'all'
                  ? 'bg-white text-[#192D20] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Tie-ups ({partners.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('stay')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === 'stay'
                  ? 'bg-white text-[#192D20] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BedDouble className="w-3.5 h-3.5 text-amber-600" />
              <span>Cottages & Hotels</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('food')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === 'food'
                  ? 'bg-white text-[#192D20] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-rose-600" />
              <span>Restaurants & Food</span>
            </button>
          </div>

          <span className="text-xs text-gray-500 font-medium">
            Showing {partners.length} tie-up partners
          </span>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search partner by name, phone, code, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Locations (Munnar, Kodai, Ooty...)</option>
              {stats?.locations?.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Statuses (Active & Inactive)</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= 5. PARTNERS GRID / LIST ================= */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-gray-500 font-medium mt-2">
            Loading tie-ups and rate agreements...
          </span>
        </div>
      ) : partners.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-base text-gray-800">No partner tie-ups found</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
            No tie-up records match the selected filters. Click below to add a new cottage, hotel,
            or restaurant partner.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#192D20] text-white text-xs font-semibold hover:bg-[#264431]"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Tie-up</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {partners.map((partner) => {
            const isStay = partner.category === 'stay';
            const partnerId = partner.id || partner._id;

            return (
              <div
                key={partnerId}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Header & Badges */}
                  <div className="relative h-44 bg-gray-100 overflow-hidden">
                    {partner.imageUrl ? (
                      <img
                        src={partner.imageUrl}
                        alt={partner.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-emerald-800 to-[#192D20] text-white p-4 text-center">
                        {isStay ? (
                          <BedDouble className="w-12 h-12 text-amber-300/60 mb-2" />
                        ) : (
                          <UtensilsCrossed className="w-12 h-12 text-emerald-300/60 mb-2" />
                        )}
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                          {partner.type}
                        </span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Partner Code & Category Tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-[11px] font-mono font-bold text-amber-300 tracking-wider">
                        {partner.partnerCode}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold backdrop-blur-xs uppercase tracking-wider ${
                          isStay
                            ? 'bg-amber-500/90 text-white'
                            : 'bg-emerald-600/90 text-white'
                        }`}
                      >
                        {partner.type}
                      </span>
                    </div>

                    {/* Status Badge Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(partner)}
                      title="Click to toggle status"
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold backdrop-blur-xs flex items-center gap-1 transition-all ${
                        partner.status === 'active'
                          ? 'bg-emerald-500/90 text-white hover:bg-emerald-600'
                          : 'bg-gray-800/90 text-gray-300 hover:bg-gray-900'
                      }`}
                    >
                      {partner.status === 'active' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>

                    {/* Bottom overlay: Name & Location */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-serif font-bold text-base leading-snug drop-shadow-xs line-clamp-1">
                        {partner.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-200 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
                        <span className="truncate">{partner.location}</span>
                        {partner.rating && (
                          <span className="flex items-center gap-0.5 ml-auto text-amber-300 font-semibold text-[11px]">
                            <Star className="w-3 h-3 fill-amber-300" />
                            {partner.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3.5">
                    {/* Primary Highlight Rate Box */}
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                          Settlement Basis: {partner.pricingModel.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl font-black text-[#192D20]">
                            {partner.pricingModel === 'per_person'
                              ? formatINR(partner.pricePerPerson)
                              : partner.pricingModel === 'per_room'
                              ? formatINR(partner.pricePerRoom)
                              : formatINR(partner.pricePerTrip)}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {partner.pricingModel === 'per_person'
                              ? '/ person'
                              : partner.pricingModel === 'per_room'
                              ? '/ room / night'
                              : '/ whole trip'}
                          </span>
                        </div>
                      </div>

                      {/* Secondary rate chips */}
                      <div className="text-right space-y-0.5">
                        {isStay && partner.pricePerRoom > 0 && partner.pricingModel !== 'per_room' && (
                          <p className="text-[11px] text-gray-600 font-medium">
                            Room: <strong>{formatINR(partner.pricePerRoom)}</strong>
                          </p>
                        )}
                        {partner.pricePerTrip > 0 && partner.pricingModel !== 'per_trip' && (
                          <p className="text-[11px] text-gray-600 font-medium">
                            Trip: <strong>{formatINR(partner.pricePerTrip)}</strong>
                          </p>
                        )}
                        {isStay ? (
                          <span className="inline-block text-[10px] text-gray-500">
                            Cap: {partner.capacity} rooms ({partner.maxGuestsPerRoom} guests/rm)
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] text-gray-500">
                            Cap: {partner.capacity} seating
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meal Pricing breakdown (if restaurant or food available) */}
                    {!isStay && partner.mealPricing && (
                      <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center">
                        <div className="p-1">
                          <span className="text-[9px] uppercase font-semibold text-emerald-800 block">
                            B'fast
                          </span>
                          <span className="text-xs font-bold text-gray-800">
                            ₹{partner.mealPricing.breakfast || 0}
                          </span>
                        </div>
                        <div className="p-1">
                          <span className="text-[9px] uppercase font-semibold text-emerald-800 block">
                            Lunch
                          </span>
                          <span className="text-xs font-bold text-gray-800">
                            ₹{partner.mealPricing.lunch || 0}
                          </span>
                        </div>
                        <div className="p-1">
                          <span className="text-[9px] uppercase font-semibold text-emerald-800 block">
                            Dinner
                          </span>
                          <span className="text-xs font-bold text-gray-800">
                            ₹{partner.mealPricing.dinner || 0}
                          </span>
                        </div>
                        <div className="p-1 bg-emerald-100/60 rounded">
                          <span className="text-[9px] uppercase font-bold text-emerald-900 block">
                            Full Day
                          </span>
                          <span className="text-xs font-black text-emerald-800">
                            ₹{partner.mealPricing.fullDay || partner.pricePerPerson}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Amenities Pill Tags */}
                    {partner.amenities && partner.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {partner.amenities.slice(0, 4).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            <span>{amenity}</span>
                          </span>
                        ))}
                        {partner.amenities.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px]">
                            +{partner.amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Contact & Phone */}
                    <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                      {partner.contactPerson && (
                        <p className="truncate">
                          <strong className="text-gray-800">Contact:</strong> {partner.contactPerson}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <a
                          href={`tel:${partner.phone}`}
                          className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{partner.phone}</span>
                        </a>

                        <a
                          href={`https://wa.me/${partner.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* Payment Terms Note */}
                    {partner.paymentTerms && (
                      <div className="text-[11px] text-gray-500 bg-amber-50/60 p-2 rounded-lg border border-amber-100/60">
                        <strong className="text-amber-800">Terms:</strong> {partner.paymentTerms}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    Updated {partner.updatedAt ? new Date(partner.updatedAt).toLocaleDateString() : 'recently'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(partner)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-[#192D20] hover:bg-gray-200 transition-colors"
                      title="Edit tie-up"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(partnerId!)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Delete tie-up"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= 6. ADD / EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#192D20] text-white">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/10 text-amber-300">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    {editingPartner ? 'Edit Partner Tie-up' : 'Add New Partner Tie-up'}
                  </h3>
                  <p className="text-xs text-gray-300">
                    Set up contract pricing per trip, per person, per room, and food arrangements
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Type and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Partner Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value as PartnerType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <optgroup label="Stay Tie-ups">
                      <option value="cottage">Cottage</option>
                      <option value="hotel">Hotel</option>
                      <option value="resort">Resort</option>
                      <option value="homestay">Homestay</option>
                    </optgroup>
                    <optgroup label="Food & Dining Tie-ups">
                      <option value="restaurant">Restaurant</option>
                      <option value="mess">Mess / Traditional Food</option>
                      <option value="cafe">Cafe</option>
                      <option value="other">Other Vendor</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Category (Stay vs Food)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.category === 'stay' ? 'STAY (Accommodation)' : 'FOOD (Dining / Mess)'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-xs sm:text-sm text-gray-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Partner Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.partnerCode}
                    onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. COT-101 or RES-501"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-mono uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Partner / Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Misty Woods Pine Cottage / Malabar Spice Mess"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Location / Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Munnar, Kanthaloor, Kodaikanal, Ooty"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Contact Person & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Manager Suresh / Chef Basheer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 94421 88210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="partner@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Detailed Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, Landmark, Near viewpoint, Pincode"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* ================= PRICING STRUCTURE SECTION ================= */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-4">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-amber-800" />
                  <h4 className="font-serif font-bold text-sm text-amber-950">
                    Pricing & Settlement Rates (Per Trip / Per Person / Per Room)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      Primary Pricing Model
                    </label>
                    <select
                      value={formData.pricingModel}
                      onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value as PricingModel })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="per_person">Per Person / Head</option>
                      <option value="per_trip">Per Whole Trip (Package)</option>
                      {formData.category === 'stay' && (
                        <option value="per_room">Per Room / Night</option>
                      )}
                      {formData.category === 'food' && (
                        <option value="per_meal">Per Individual Meal</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      Amount Per Person (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.pricePerPerson}
                      onChange={(e) => setFormData({ ...formData, pricePerPerson: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-bold text-[#192D20] focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      Amount Per Trip Fixed (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.pricePerTrip}
                      onChange={(e) => setFormData({ ...formData, pricePerTrip: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-bold text-[#192D20] focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  {formData.category === 'stay' ? (
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                        Amount Per Room (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.pricePerRoom}
                        onChange={(e) => setFormData({ ...formData, pricePerRoom: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-bold text-[#192D20] focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                        Full Day Meals Total (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.mealPricing.fullDay}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mealPricing: {
                              ...formData.mealPricing,
                              fullDay: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-bold text-[#192D20] focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Restaurant Meal Breakdown (If food category) */}
                {formData.category === 'food' && (
                  <div className="pt-2 border-t border-amber-200/60">
                    <span className="text-[11px] font-bold text-amber-900 block mb-2">
                      Meal-wise Breakdown (Optional per item pricing):
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">
                          Breakfast (₹/head)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.mealPricing.breakfast}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              mealPricing: {
                                ...formData.mealPricing,
                                breakfast: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">Lunch (₹/head)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.mealPricing.lunch}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              mealPricing: {
                                ...formData.mealPricing,
                                lunch: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">Dinner (₹/head)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.mealPricing.dinner}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              mealPricing: {
                                ...formData.mealPricing,
                                dinner: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Capacity & Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    {formData.category === 'stay' ? 'Total Rooms Available' : 'Seating Capacity'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {formData.category === 'stay' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      Max Guests / Room
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxGuestsPerRoom}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxGuestsPerRoom: parseInt(e.target.value, 10) || 2,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Food Preference
                  </label>
                  <select
                    value={formData.foodType}
                    onChange={(e) => setFormData({ ...formData, foodType: e.target.value as FoodType })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="all">All (Veg & Non-Veg)</option>
                    <option value="veg">Pure Vegetarian Only</option>
                    <option value="non_veg">Non-Veg Special</option>
                    <option value="buffet">Buffet & BBQ</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 4.5 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Amenities & Inclusions */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Amenities & Facilities Included
                </label>
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {(formData.category === 'stay' ? COMMON_STAY_AMENITIES : COMMON_FOOD_AMENITIES).map(
                    (item) => {
                      const selected = formData.amenities.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleAmenity(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selected
                              ? 'bg-[#192D20] text-white shadow-xs'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    }
                  )}
                </div>

                {/* Add Custom Amenity */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    placeholder="Add custom amenity (e.g. Free driver food, Tent setup)..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomAmenity();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomAmenity}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Payment Terms & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Payment Terms / Settlement Conditions
                  </label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="e.g. 25% Advance booking, balance at checkout"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Internal Notes (Visible to Admin Only)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Special discounts for groups > 10 pax, driver stay is complimentary, contact Manager Murugan directly."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#192D20] text-white hover:bg-[#25422F] text-xs sm:text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingPartner ? 'Update Tie-up' : 'Save Tie-up Partner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 7. DELETE CONFIRMATION MODAL ================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900">
                Delete Partner Tie-up?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove this partner tie-up contract? This action cannot be
                undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
