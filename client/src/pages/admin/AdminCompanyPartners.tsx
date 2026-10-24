import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Receipt,
  Calculator,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  IndianRupee,
  Phone,
  Percent,
  Check,
  Copy,
  Loader2,
  AlertCircle,
  TrendingUp,
  Settings,
  Car,
  BedDouble,
  UtensilsCrossed,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckSquare,
  Square,
  Building,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../../api/settings';
import {
  getPartners,
  calculateTripSettlement,
  saveTripSettlement,
  autoSettleAllBookings,
} from '../../api/partners';
import { getBookings } from '../../api/bookings';
import {
  IPartnerTieup,
  ISettlementCalculation,
  IBooking,
  ITripExpenseDefaults,
} from '../../types';
import { formatINR } from '../../utils/formatters';
import CommissionLedger from '../../components/admin/CommissionLedger';

interface OrganizerPartnerItem {
  id: string;
  name: string;
  phone: string;
  upiId?: string;
  sharePercent: number;
  role?: string;
}

export default function AdminCompanyPartners(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'calculator' ? 'calculator' : 'ledger';
  const [activeTab, setActiveTab] = useState<'ledger' | 'calculator' | 'manage' | 'defaults'>(initialTab);

  // Pre-configured baseline pricing defaults
  const [tripDefaults, setTripDefaults] = useState<ITripExpenseDefaults>({
    stayRatePerPersonNight: 600,
    foodRatePerPersonDay: 400,
    transportRatePerDay: 1800,
    driverBataPerTrip: 500,
    miscRatePerTrip: 300,
    autoSettleOnStatus: 'confirmed',
  });
  const [savingDefaults, setSavingDefaults] = useState<boolean>(false);
  const [autoSettlingAll, setAutoSettlingAll] = useState<boolean>(false);
  const [ledgerRefreshKey, setLedgerRefreshKey] = useState<number>(0);

  // Company partners state
  const [partners, setPartners] = useState<OrganizerPartnerItem[]>([
    {
      id: 'p1',
      name: 'Partner 1 (Mahesh)',
      phone: '9876543210',
      upiId: 'mahesh@okaxis',
      sharePercent: 50,
      role: 'Managing Partner',
    },
    {
      id: 'p2',
      name: 'Partner 2 (Co-Organizer)',
      phone: '9845123456',
      upiId: 'partner2@okhdfcbank',
      sharePercent: 50,
      role: 'Operations Partner',
    },
  ]);
  const [partnerNotes, setPartnerNotes] = useState<string>(
    'Only pure Net Organizing Profit (Gross Collection minus Hotel, Food, Jeep Fuel & Driver Bata) is shared.'
  );
  const [loadingPartners, setLoadingPartners] = useState<boolean>(true);
  const [savingPartners, setSavingPartners] = useState<boolean>(false);

  // Vendor tieups for calculator selection
  const [vendorList, setVendorList] = useState<IPartnerTieup[]>([]);

  // Booking auto-selection states
  const [bookingsList, setBookingsList] = useState<IBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);

  // Meal selections: Pre-configured rates applied automatically
  const [selectedMeals, setSelectedMeals] = useState<{
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  }>({
    breakfast: false,
    lunch: true,
    dinner: false,
  });

  // Calculator states
  const [calcPersons, setCalcPersons] = useState<number>(6);
  const [calcNights, setCalcNights] = useState<number>(1);
  const [calcDays, setCalcDays] = useState<number>(2);
  const [selectedStayId, setSelectedStayId] = useState<string>('');
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [calcRevenue, setCalcRevenue] = useState<number>(28000);
  const [calcTransport, setCalcTransport] = useState<number>(4500);
  const [calcMisc, setCalcMisc] = useState<number>(500);
  const [settlementResult, setSettlementResult] = useState<ISettlementCalculation | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [savingToLedger, setSavingToLedger] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const totalShareAllocated = partners.reduce(
    (sum, p) => sum + (Number(p.sharePercent) || 0),
    0
  );

  // Auto-fill from booking handler
  const handleAutoSelectBooking = (booking: IBooking, currentVendors = vendorList) => {
    setSelectedBooking(booking);
    setSelectedBookingId(booking._id);

    const pax = Math.max(1, booking.persons || 1);
    setCalcPersons(pax);
    setCalcRevenue(booking.totalPrice || 0);

    const pkgObj = typeof booking.package === 'object' && booking.package !== null ? booking.package : null;
    const nights =
      booking.packageSnapshot?.duration?.nights !== undefined
        ? booking.packageSnapshot.duration.nights
        : pkgObj?.duration?.nights !== undefined
        ? pkgObj.duration.nights
        : 1;
    const days =
      booking.packageSnapshot?.duration?.days !== undefined
        ? booking.packageSnapshot.duration.days
        : pkgObj?.duration?.days !== undefined
        ? pkgObj.duration.days
        : 2;
    setCalcNights(nights);
    setCalcDays(days);

    // Auto calculate transport based on days
    setCalcTransport(Math.max(1500, days * 1800));

    // Match destination tie-up vendors
    const dest = (booking.packageSnapshot?.destination || '').toLowerCase();
    const stayMatches = currentVendors.filter((v) => v.category === 'stay');
    const matchedStay =
      stayMatches.find((v) => v.location.toLowerCase().includes(dest)) || stayMatches[0];
    if (matchedStay) {
      setSelectedStayId(String(matchedStay.id));
    }

    const foodMatches = currentVendors.filter((v) => v.category === 'food');
    const matchedFood =
      foodMatches.find((v) => v.location.toLowerCase().includes(dest)) || foodMatches[0];
    if (matchedFood) {
      setSelectedFoodId(String(matchedFood.id));
    }

    // Default to Lunch included
    setSelectedMeals({ breakfast: false, lunch: true, dinner: false });

    toast.success(
      `⚡ Auto-loaded ${booking.bookingId} (${booking.customerName})! Pre-entered vendor rates applied.`
    );
  };

  // Load Settings, Vendors, and Bookings
  useEffect(() => {
    const initData = async () => {
      try {
        setLoadingPartners(true);
        const [settingsRes, vendorsRes, bookingsRes] = await Promise.all([
          getSettings().catch(() => null),
          getPartners({ status: 'active' }).catch(() => null),
          getBookings({ limit: 100 }).catch(() => null),
        ]);

        if (settingsRes?.success && settingsRes.settings?.organizerPartners) {
          const org = settingsRes.settings.organizerPartners;
          if (Array.isArray(org.partners) && org.partners.length > 0) {
            setPartners(
              org.partners.map((p: any, idx: number) => ({
                id: p.id || `p-${idx + 1}`,
                name: p.name || `Partner ${idx + 1}`,
                phone: p.phone || '',
                upiId: p.upiId || '',
                sharePercent: p.sharePercent ?? 50,
                role: p.role || 'Partner',
              }))
            );
          }
          if (org.notes) {
            setPartnerNotes(org.notes);
          }
        }

        if (settingsRes?.success && settingsRes.settings?.tripExpenseDefaults) {
          setTripDefaults(settingsRes.settings.tripExpenseDefaults);
        }

        let vList: IPartnerTieup[] = [];
        if (vendorsRes?.success && vendorsRes.partners) {
          vList = vendorsRes.partners;
          setVendorList(vList);
        }

        let bList: IBooking[] = [];
        if (bookingsRes?.success && bookingsRes.bookings) {
          bList = bookingsRes.bookings;
          setBookingsList(bList);
        }

        // Check if query param bookingId exists
        const queryBookingId = searchParams.get('bookingId');
        if (queryBookingId && bList.length > 0) {
          const target = bList.find(
            (b) =>
              String(b._id) === String(queryBookingId) ||
              String(b.bookingId) === String(queryBookingId)
          );
          if (target) {
            handleAutoSelectBooking(target, vList);
          }
        }
      } catch (err) {
        console.error('Failed to load partners data', err);
      } finally {
        setLoadingPartners(false);
      }
    };

    initData();
  }, []);

  // Recalculate settlement on parameter changes
  useEffect(() => {
    const runCalculation = async () => {
      try {
        setCalculating(true);
        const res = await calculateTripSettlement({
          stayPartnerId: selectedStayId || null,
          foodPartnerId: selectedFoodId || null,
          persons: calcPersons,
          nights: calcNights,
          days: calcDays,
          selectedMeals,
          tripRevenue: calcRevenue,
          transportCost: calcTransport,
          miscCost: calcMisc,
          partners: partners.map((p) => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            sharePercent: p.sharePercent,
            upiId: p.upiId,
          })),
        });

        if (res.success) {
          setSettlementResult(res.data);
        }
      } catch (err) {
        console.error('Settlement calculation error', err);
      } finally {
        setCalculating(false);
      }
    };

    const timer = setTimeout(() => {
      runCalculation();
    }, 250);

    return () => clearTimeout(timer);
  }, [
    calcPersons,
    calcNights,
    calcDays,
    selectedStayId,
    selectedFoodId,
    selectedMeals,
    calcRevenue,
    calcTransport,
    calcMisc,
    partners,
  ]);

  // Add new partner to list
  const handleAddPartner = () => {
    const newP: OrganizerPartnerItem = {
      id: `p-${Date.now()}`,
      name: `Partner ${partners.length + 1}`,
      phone: '',
      upiId: '',
      sharePercent: 0,
      role: 'Co-Organizer',
    };
    setPartners((prev) => [...prev, newP]);
  };

  // Update a partner field
  const handleUpdatePartner = (index: number, field: keyof OrganizerPartnerItem, value: any) => {
    setPartners((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // Remove partner
  const handleRemovePartner = (index: number) => {
    if (partners.length <= 1) {
      toast.error('At least 1 partner is required');
      return;
    }
    setPartners((prev) => prev.filter((_, i) => i !== index));
  };

  // Save partners configuration to backend settings
  const handleSavePartnerSettings = async () => {
    if (totalShareAllocated !== 100) {
      toast.error(`Total percentage must equal 100%. Currently allocated: ${totalShareAllocated}%`);
      return;
    }

    try {
      setSavingPartners(true);
      const res = await updateSettings({
        organizerPartners: {
          enabled: true,
          partners,
          notes: partnerNotes,
        },
      });

      if (res.success) {
        toast.success('Company partners & profit share percentages saved successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save partner settings');
    } finally {
      setSavingPartners(false);
    }
  };

  // Save baseline trip defaults
  const handleSaveTripDefaults = async () => {
    try {
      setSavingDefaults(true);
      const res = await updateSettings({
        tripExpenseDefaults: tripDefaults,
      });

      if (res.success) {
        toast.success('Trip Baseline Pricing & Master Rates saved successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save baseline rates');
    } finally {
      setSavingDefaults(false);
    }
  };

  // 1-Click Auto Settle all trips
  const handleAutoSettleAll = async () => {
    try {
      setAutoSettlingAll(true);
      const res = await autoSettleAllBookings();
      if (res.success) {
        toast.success(res.message);
        setActiveTab('ledger');
        setLedgerRefreshKey((k) => k + 1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to auto-settle trips');
    } finally {
      setAutoSettlingAll(false);
    }
  };

  // Save current calculation to commission ledger
  const handleSaveCalculationToLedger = async () => {
    if (!settlementResult?.partnerSplit) {
      toast.error('Please calculate trip settlement first');
      return;
    }

    try {
      setSavingToLedger(true);
      const selectedStay = vendorList.find((p) => String(p.id) === String(selectedStayId));
      const selectedFood = vendorList.find((p) => String(p.id) === String(selectedFoodId));
      const destination = selectedStay?.location || 'Munnar';
      const split = settlementResult.partnerSplit;

      const tripTitle = selectedBooking
        ? `${selectedBooking.packageSnapshot?.title || 'Tour'} (${selectedBooking.customerName})`
        : `${destination} Tour - ${calcPersons} Guests (${calcDays}D/${calcNights}N)`;

      const res = await saveTripSettlement({
        bookingId: selectedBooking?.bookingId || undefined,
        tripTitle,
        destination,
        tripDate: selectedBooking?.travelDate
          ? new Date(selectedBooking.travelDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        numPersons: calcPersons,
        numNights: calcNights,
        numDays: calcDays,
        tripRevenue: calcRevenue,
        stayCost: settlementResult.stay?.totalCost || 0,
        stayPartnerName: selectedStay?.name || 'Direct Stay',
        foodCost: settlementResult.food?.totalCost || 0,
        foodPartnerName: selectedFood?.name || 'Direct Food',
        transportCost: calcTransport,
        miscCost: calcMisc,
        totalExpenses: split.totalTripExpenses,
        netProfit: split.netOrganizingProfit,
        profitMarginPercent: split.profitMarginPercent,
        partnersBreakdown: (split.partners || []).map((p) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          sharePercent: p.sharePercent,
          amount: p.amount,
          status: 'pending',
          paymentMode: 'gpay',
          paymentRef: '',
        })),
        overallStatus: 'pending',
        notes: selectedBooking
          ? `Auto-generated profit split from Booking ${selectedBooking.bookingId} (${selectedBooking.customerName}). Applied rates: Hotel (${selectedStay?.name || 'N/A'}), Food (${selectedFood?.name || 'N/A'} - ${settlementResult.food?.mealSelectionSummary || 'Lunch'}).`
          : `Recorded via Company Partners Calculator. Travellers: ${calcPersons}.`,
      });

      if (res.success) {
        toast.success('Trip settlement recorded in Ledger!');
        setActiveTab('ledger');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settlement record');
    } finally {
      setSavingToLedger(false);
    }
  };

  // WhatsApp report copy
  const handleCopyWhatsAppReport = () => {
    if (!settlementResult?.partnerSplit) return;
    const split = settlementResult.partnerSplit;
    const partnerLines = (split.partners || [])
      .map(
        (p) =>
          `• 👤 *${p.name}* (${p.sharePercent}%): *${formatINR(p.amount)}* ${
            p.phone ? `| 📱 ${p.phone}` : ''
          }`
      )
      .join('\n');

    const text = `🏔️ *HILLS ANGEL - TRIP SETTLEMENT & NET PROFIT SHARE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 *Guests:* ${calcPersons} Pax | 📅 *Duration:* ${calcDays}D / ${calcNights}N
🏡 *Stay Cost:* ${formatINR(settlementResult.stay?.totalCost || 0)}
🍽️ *Food Cost:* ${formatINR(settlementResult.food?.totalCost || 0)}
🚙 *Jeep Fuel / Driver Bata:* ${formatINR(calcTransport)}
🎫 *Misc Costs:* ${formatINR(calcMisc)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *Gross Customer Revenue:* ${formatINR(calcRevenue)}
📦 *Total Trip Expenses:* ${formatINR(split.totalTripExpenses)}
✨ *NET ORGANIZING PROFIT (நிகர லாபம்):* ${formatINR(split.netOrganizingProfit)} (${split.profitMarginPercent}% Margin)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤝 *PARTNERS NET PROFIT SHARE (பங்கு):*
${partnerLines}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Rule: Only Net Profit is shared among company partners._
_Generated via Hills Angel Admin Console_`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    toast.success('WhatsApp profit split report copied!');
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ================= 1. PAGE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#192D20]">
                Company Partners & Profit Share (நிறுவன பார்ட்னர்கள்)
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Manage Hills Angel organizers, commission percentages, and track net profit payouts (Paid vs Pending)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoSettleAll}
            disabled={autoSettlingAll}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Automatically generate accounts for all bookings using pre-set rates"
          >
            {autoSettlingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
            <span>{autoSettlingAll ? 'Generating Accounts...' : '⚡ Auto-Settle All Trips'}</span>
          </button>

          {activeTab === 'manage' && (
            <button
              type="button"
              onClick={handleAddPartner}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#192D20] text-white hover:bg-[#25422F] text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Partner</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. MAIN TABS ================= */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-white text-[#192D20] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span>Commission & Payout Ledger</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            Live Records
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calculator')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'calculator'
              ? 'bg-white text-[#192D20] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calculator className="w-4 h-4 text-amber-600" />
          <span>Trip Net Profit Calculator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'manage'
              ? 'bg-white text-[#192D20] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Manage Partners & Share % ({partners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('defaults')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'defaults'
              ? 'bg-white text-[#192D20] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 text-purple-600" />
          <span>⚙️ Pre-Set Master Rates (விலை நிர்ணயம்)</span>
        </button>
      </div>

      {/* ================= TAB 1: COMMISSION & SETTLEMENT LEDGER ================= */}
      {activeTab === 'ledger' && (
        <CommissionLedger key={ledgerRefreshKey} onSwitchToCalculator={() => setActiveTab('calculator')} />
      )}

      {/* ================= TAB 2: TRIP NET PROFIT CALCULATOR ================= */}
      {activeTab === 'calculator' && (
        <div className="bg-gradient-to-br from-[#192D20] via-[#1E3626] to-[#142419] text-white rounded-2xl p-5 sm:p-7 shadow-xl border border-emerald-900/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                  <Calculator className="w-5 h-5" />
                </span>
                <h3 className="font-serif font-bold text-lg text-white">
                  Trip Settlement & Co-Organizers Net Profit Split
                </h3>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Enter customer collection, vendor bills, and fuel to calculate each partner&apos;s net profit payout.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyWhatsAppReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? 'Copied!' : 'Copy WhatsApp Report'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCalculationToLedger}
                disabled={savingToLedger}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {savingToLedger ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save to Ledger</span>
              </button>
            </div>
          </div>

          {/* Rule banner */}
          <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/25 text-xs text-amber-200 flex items-start gap-2.5">
            <IndianRupee className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <span>
              <strong>Strict Profit Rule:</strong> Customer Collection - (Stay Cost + Food Cost + Jeep Fuel/Driver Bata) = <strong>Net Organizing Profit (நிகர லாபம்)</strong>. This pure profit is distributed below among partners.
            </span>
          </div>

          {/* ================= 2.1 AUTO-FILL FROM BOOKING BAR ================= */}
          <div className="p-4 rounded-2xl bg-white/10 border border-white/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-400 text-black font-black">
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                    ⚡ Auto-Generate Net Profit from Booking (Pre-configured Rates)
                  </h4>
                  <p className="text-[11px] text-gray-300">
                    Choose any customer booking to auto-fill collection, hotel bills, and lunch/food rates automatically.
                  </p>
                </div>
              </div>

              {selectedBooking && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Auto-Linked: {selectedBooking.bookingId}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBooking(null);
                      setSelectedBookingId('');
                    }}
                    className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={selectedBookingId}
                onChange={(e) => {
                  const targetId = e.target.value;
                  if (!targetId) {
                    setSelectedBooking(null);
                    setSelectedBookingId('');
                    return;
                  }
                  const b = bookingsList.find(
                    (item) => String(item._id) === targetId || String(item.bookingId) === targetId
                  );
                  if (b) {
                    handleAutoSelectBooking(b);
                  }
                }}
                className="w-full bg-[#192D20] text-white border border-white/25 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                <option value="">-- Select a Customer Booking to Auto-Calculate --</option>
                {bookingsList.map((b) => (
                  <option key={b._id} value={b._id} className="bg-[#192D20] py-1">
                    {b.bookingId} — {b.customerName} ({b.packageSnapshot?.destination || 'Tour'}, {b.persons} Pax, {formatINR(b.totalPrice)}) [{b.status}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calculator Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Stay Vendor */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                Cottage / Hotel Tie-up
              </label>
              <select
                value={selectedStayId}
                onChange={(e) => setSelectedStayId(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              >
                <option value="" className="bg-[#192D20]">None (Direct / No Stay)</option>
                {vendorList
                  .filter((v) => v.category === 'stay')
                  .map((stay) => (
                    <option key={stay.id} value={stay.id} className="bg-[#192D20]">
                      {stay.name} ({formatINR(stay.pricePerPerson || stay.pricePerRoom || stay.pricePerTrip)})
                    </option>
                  ))}
              </select>

              {/* Pre-configured Stay Details info */}
              {(() => {
                const stay = vendorList.find((v) => String(v.id) === String(selectedStayId));
                if (!stay) return null;
                return (
                  <div className="mt-2 p-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-gray-300 space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-amber-200">
                      <span>Pre-configured:</span>
                      <span>
                        {stay.pricingModel === 'per_room'
                          ? `${formatINR(stay.pricePerRoom)}/room (Max ${stay.maxGuestsPerRoom || 2} pax)`
                          : `${formatINR(stay.pricePerPerson)}/head`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-300 font-semibold pt-0.5 border-t border-white/10">
                      <span>Stay Bill:</span>
                      <span>{formatINR(settlementResult?.stay?.totalCost || 0)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Food Vendor */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                Food / Restaurant Tie-up
              </label>
              <select
                value={selectedFoodId}
                onChange={(e) => setSelectedFoodId(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              >
                <option value="" className="bg-[#192D20]">None (No Food)</option>
                {vendorList
                  .filter((v) => v.category === 'food')
                  .map((food) => (
                    <option key={food.id} value={food.id} className="bg-[#192D20]">
                      {food.name} ({formatINR(food.pricePerPerson || food.pricePerTrip)}/head)
                    </option>
                  ))}
              </select>

              {/* Pre-configured Food & Meal Checkboxes */}
              {(() => {
                const food = vendorList.find((v) => String(v.id) === String(selectedFoodId));
                if (!food) return null;
                const mealPrices = typeof food.mealPricing === 'object' && food.mealPricing !== null
                  ? food.mealPricing
                  : { breakfast: 0, lunch: 0, dinner: 0 };
                return (
                  <div className="mt-2 p-2 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      Pre-configured Meals:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <label className="inline-flex items-center gap-1 text-[11px] cursor-pointer bg-white/10 px-2 py-1 rounded-lg hover:bg-white/15">
                        <input
                          type="checkbox"
                          checked={selectedMeals.lunch}
                          onChange={(e) =>
                            setSelectedMeals((prev) => ({ ...prev, lunch: e.target.checked }))
                          }
                          className="rounded text-amber-400 accent-amber-400"
                        />
                        <span className="font-bold text-amber-300">
                          Lunch {mealPrices.lunch ? `(${formatINR(mealPrices.lunch)})` : ''}
                        </span>
                      </label>
                      <label className="inline-flex items-center gap-1 text-[11px] cursor-pointer bg-white/10 px-2 py-1 rounded-lg hover:bg-white/15">
                        <input
                          type="checkbox"
                          checked={selectedMeals.breakfast}
                          onChange={(e) =>
                            setSelectedMeals((prev) => ({ ...prev, breakfast: e.target.checked }))
                          }
                          className="rounded text-amber-400 accent-amber-400"
                        />
                        <span>
                          Breakfast {mealPrices.breakfast ? `(${formatINR(mealPrices.breakfast)})` : ''}
                        </span>
                      </label>
                      <label className="inline-flex items-center gap-1 text-[11px] cursor-pointer bg-white/10 px-2 py-1 rounded-lg hover:bg-white/15">
                        <input
                          type="checkbox"
                          checked={selectedMeals.dinner}
                          onChange={(e) =>
                            setSelectedMeals((prev) => ({ ...prev, dinner: e.target.checked }))
                          }
                          className="rounded text-amber-400 accent-amber-400"
                        />
                        <span>
                          Dinner {mealPrices.dinner ? `(${formatINR(mealPrices.dinner)})` : ''}
                        </span>
                      </label>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-emerald-300 font-semibold pt-1 border-t border-white/10">
                      <span>Food Bill:</span>
                      <span>{formatINR(settlementResult?.food?.totalCost || 0)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Travellers count */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                Guests (Pax)
              </label>
              <input
                type="number"
                min="1"
                value={calcPersons}
                onChange={(e) => setCalcPersons(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Nights */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                Nights Stay
              </label>
              <input
                type="number"
                min="0"
                value={calcNights}
                onChange={(e) => setCalcNights(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Days */}
            <div>
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                Tour Days
              </label>
              <input
                type="number"
                min="1"
                value={calcDays}
                onChange={(e) => setCalcDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Revenue & Transport Cost inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
            <div>
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                Customer Tour Package Revenue (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={calcRevenue}
                onChange={(e) => setCalcRevenue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm font-bold text-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                Jeep Fuel & Driver Bata (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={calcTransport}
                onChange={(e) => setCalcTransport(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block mb-1.5">
                Misc / Permits / Campfire (₹)
              </label>
              <input
                type="number"
                min="0"
                step="250"
                value={calcMisc}
                onChange={(e) => setCalcMisc(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Results Summary & Partner Profit Distribution */}
          {settlementResult?.partnerSplit && (
            <div className="pt-4 border-t border-white/15 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                    Gross Revenue
                  </span>
                  <p className="text-xl font-black text-white mt-0.5">
                    {formatINR(settlementResult.partnerSplit.tripRevenue)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {calcPersons} pax ({formatINR(Math.round(settlementResult.partnerSplit.tripRevenue / calcPersons))}/head)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase tracking-wider text-rose-300 font-bold block">
                    Total Direct Expenses
                  </span>
                  <p className="text-xl font-black text-rose-400 mt-0.5">
                    {formatINR(settlementResult.partnerSplit.totalTripExpenses)}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    Vendors ({formatINR(settlementResult.partnerSplit.totalVendorPayout)}) + Fuel ({formatINR(calcTransport)})
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-amber-500/20 border border-emerald-400/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-black block">
                      Net Organizing Profit
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-400 text-black">
                      {settlementResult.partnerSplit.profitMarginPercent}% Margin
                    </span>
                  </div>
                  <p className="text-2xl font-black text-emerald-300 mt-0.5 font-mono">
                    {formatINR(settlementResult.partnerSplit.netOrganizingProfit)}
                  </p>
                  <p className="text-[10px] text-emerald-200 mt-0.5">
                    Pure profit distributed below
                  </p>
                </div>
              </div>

              {/* Individual Partner Profit Payout Cards */}
              <div>
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block mb-2.5">
                  Partner Profit Payout Distribution (நிகர லாபப் பங்கு):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {(settlementResult.partnerSplit.partners || []).map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-4 rounded-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-amber-400/30 hover:border-amber-400/60 transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[130px]">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-black font-mono">
                          {p.sharePercent}%
                        </span>
                      </div>
                      <p className="text-2xl font-black text-amber-300 mt-1 font-mono">
                        {formatINR(p.amount)}
                      </p>
                      <p className="text-[10px] text-gray-300">Net Profit Share</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: MANAGE PARTNERS & SHARE % ================= */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#192D20]">
                Company Partners & Commission Allocation
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Define the co-organizing partners of Hills Angel. Total share percentage must equal 100%.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                  totalShareAllocated === 100
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}
              >
                <span>Total Allocated: {totalShareAllocated}%</span>
                {totalShareAllocated === 100 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </span>

              <button
                type="button"
                onClick={handleSavePartnerSettings}
                disabled={savingPartners || totalShareAllocated !== 100}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#192D20] text-white text-xs font-semibold hover:bg-[#25422F] transition-all shadow-sm disabled:opacity-50"
              >
                {savingPartners ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Partner Settings</span>
              </button>
            </div>
          </div>

          {/* Partner Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map((partner, index) => (
              <div
                key={partner.id || index}
                className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-bold text-sm text-gray-900">
                      Partner {index + 1}
                    </span>
                  </div>

                  {partners.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePartner(index)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove partner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Partner Name *
                    </label>
                    <input
                      type="text"
                      value={partner.name}
                      onChange={(e) => handleUpdatePartner(index, 'name', e.target.value)}
                      placeholder="e.g. Mahesh"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Share Percentage (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={partner.sharePercent}
                        onChange={(e) =>
                          handleUpdatePartner(
                            index,
                            'sharePercent',
                            Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-amber-700 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Mobile / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={partner.phone}
                      onChange={(e) => handleUpdatePartner(index, 'phone', e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      UPI ID / GPay Number
                    </label>
                    <input
                      type="text"
                      value={partner.upiId || ''}
                      onChange={(e) => handleUpdatePartner(index, 'upiId', e.target.value)}
                      placeholder="e.g. name@okhdfcbank"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Partnership Policy Notes
            </label>
            <textarea
              rows={2}
              value={partnerNotes}
              onChange={(e) => setPartnerNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
              placeholder="e.g. All direct costs are deducted before distributing net profit."
            />
          </div>
        </div>
      )}

      {/* ================= TAB 4: PRE-SET MASTER TRIP RATES ================= */}
      {activeTab === 'defaults' && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Settings className="w-5 h-5" />
                </span>
                <h3 className="font-serif font-bold text-lg text-text">
                  Baseline Trip Pricing & Master Rates (முன்னரே நிர்ணயிக்கப்பட்ட விலை விபரம்)
                </h3>
              </div>
              <p className="text-xs text-muted mt-1">
                Configure baseline unit prices for Stay, Food, Transport, and Driver Bata. Whenever a trip booking is created or confirmed, the system uses these rates to automatically generate the full accounts settlement.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveTripDefaults}
              disabled={savingDefaults}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            >
              {savingDefaults ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{savingDefaults ? 'Saving...' : 'Save Baseline Rates'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Stay Rate */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <BedDouble className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Stay Baseline Rate (தங்குமிடம்)</h4>
                  <p className="text-[11px] text-gray-500">Per Guest / Night fallback</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={tripDefaults.stayRatePerPersonNight}
                  onChange={(e) =>
                    setTripDefaults((prev) => ({
                      ...prev,
                      stayRatePerPersonNight: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-amber-200 bg-white text-sm font-bold text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <p className="text-[11px] text-amber-800/80 leading-relaxed">
                Applied per person per night when no specific destination hotel tie-up rate is selected.
              </p>
            </div>

            {/* 2. Food Rate */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <UtensilsCrossed className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Food Baseline Rate (உணவு)</h4>
                  <p className="text-[11px] text-gray-500">Per Guest / Day (All meals)</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={tripDefaults.foodRatePerPersonDay}
                  onChange={(e) =>
                    setTripDefaults((prev) => ({
                      ...prev,
                      foodRatePerPersonDay: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm font-bold text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                Applied per person per day for standard dining contract when direct dining is used.
              </p>
            </div>

            {/* 3. Transport Rate */}
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <Car className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Vehicle / Jeep Rate (வாகனம்)</h4>
                  <p className="text-[11px] text-gray-500">Per Day (Fuel + 4x4 Jeep)</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={tripDefaults.transportRatePerDay}
                  onChange={(e) =>
                    setTripDefaults((prev) => ({
                      ...prev,
                      transportRatePerDay: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-bold text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-blue-800/80 leading-relaxed">
                Standard jeep rental and fuel expense calculated per day of the safari/tour.
              </p>
            </div>

            {/* 4. Driver Bata */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/70 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
                  <IndianRupee className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Driver Bata (டிரைவர் படி)</h4>
                  <p className="text-[11px] text-gray-500">Per Trip fixed allowance</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={tripDefaults.driverBataPerTrip}
                  onChange={(e) =>
                    setTripDefaults((prev) => ({
                      ...prev,
                      driverBataPerTrip: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-indigo-200 bg-white text-sm font-bold text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-indigo-800/80 leading-relaxed">
                Driver food allowance and outstation beta added to total trip expenses.
              </p>
            </div>

            {/* 5. Misc & Tolls */}
            <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200/70 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-100 text-rose-800">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Misc & Tolls (இதர செலவு)</h4>
                  <p className="text-[11px] text-gray-500">Permits, checkpoints & parking</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={tripDefaults.miscRatePerTrip}
                  onChange={(e) =>
                    setTripDefaults((prev) => ({
                      ...prev,
                      miscRatePerTrip: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-rose-200 bg-white text-sm font-bold text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <p className="text-[11px] text-rose-800/80 leading-relaxed">
                Forest entry tickets, parking, and miscellaneous permit fees per trip.
              </p>
            </div>

            {/* 6. Auto-Settle Trigger */}
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200/70 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Auto-Generate Accounts Trigger</h4>
                  <p className="text-[11px] text-gray-500">When to create ledger record</p>
                </div>
              </div>
              <select
                value={tripDefaults.autoSettleOnStatus || 'confirmed'}
                onChange={(e) =>
                  setTripDefaults((prev) => ({
                    ...prev,
                    autoSettleOnStatus: e.target.value as any,
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="confirmed">⚡ When Booking is Marked Confirmed</option>
                <option value="completed">🏁 When Booking is Marked Completed</option>
                <option value="both">✨ Both (Auto-Generate on Confirm & Sync)</option>
              </select>
              <p className="text-[11px] text-purple-800/80 leading-relaxed">
                Accounts ledger entry (with unique SET-2026-XXXX code) is automatically created without manual input.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-900">How Net Profit Calculation Works:</strong>
              <br />
              <code className="text-amber-800 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200 text-[11px]">
                Net Profit = Trip Revenue - (Stay Cost + Food Cost + Jeep/Transport + Driver Bata + Misc)
              </code>
              <br />
              Then, the remaining Net Profit is automatically divided between the company partners based on the configured percentages in the <strong>Manage Partners</strong> tab.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
