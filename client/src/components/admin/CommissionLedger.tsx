import React, { useState, useEffect } from 'react';
import {
  Receipt,
  IndianRupee,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  Users,
  Building2,
  UtensilsCrossed,
  Car,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  CreditCard,
  Wallet,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getTripSettlements,
  saveTripSettlement,
  getCommissionStats,
  updatePartnerPayoutStatus,
  deleteTripSettlement,
} from '../../api/partners';
import {
  ITripSettlement,
  ICommissionStats,
  IPartnerPayoutItem,
} from '../../types';
import { formatINR } from '../../utils/formatters';

export const parsePartnersBreakdown = (raw: any): IPartnerPayoutItem[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
};

interface CommissionLedgerProps {
  onSwitchToCalculator?: () => void;
}

export default function CommissionLedger({ onSwitchToCalculator }: CommissionLedgerProps): React.ReactElement {
  const [settlements, setSettlements] = useState<ITripSettlement[]>([]);
  const [stats, setStats] = useState<ICommissionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [destinationFilter, setDestinationFilter] = useState<string>('all');

  // Payout update modal state
  const [payoutModalOpen, setPayoutModalOpen] = useState<boolean>(false);
  const [selectedSettlement, setSelectedSettlement] = useState<ITripSettlement | null>(null);
  const [selectedPartnerIdx, setSelectedPartnerIdx] = useState<number | null>(null);
  const [payoutForm, setPayoutForm] = useState({
    status: 'paid' as 'paid' | 'pending',
    paymentMode: 'gpay',
    paymentRef: '',
    notes: '',
  });
  const [updatingPayout, setUpdatingPayout] = useState<boolean>(false);

  // Record manual settlement modal state
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState({
    tripTitle: '',
    destination: 'Munnar',
    tripDate: new Date().toISOString().split('T')[0],
    numPersons: 6,
    numNights: 2,
    numDays: 3,
    tripRevenue: 30000,
    stayPartnerName: '',
    stayCost: 8000,
    foodPartnerName: '',
    foodCost: 4500,
    transportCost: 4500,
    miscCost: 500,
    notes: '',
  });
  const [savingManual, setSavingManual] = useState<boolean>(false);

  // Copied summary state
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Load data
  const loadLedgerData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [settlementsRes, statsRes] = await Promise.all([
        getTripSettlements({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          destination: destinationFilter !== 'all' ? destinationFilter : undefined,
          partnerName: partnerFilter !== 'all' ? partnerFilter : undefined,
          search: search.trim() || undefined,
        }),
        getCommissionStats(),
      ]);

      if (settlementsRes.success) {
        const raw = settlementsRes.settlements || [];
        const normalized = raw.map((item: any) => ({
          ...item,
          partnersBreakdown: parsePartnersBreakdown(item.partnersBreakdown),
        }));
        setSettlements(normalized);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err: any) {
      toast.error('Failed to load commission tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedgerData();
  }, [statusFilter, destinationFilter, partnerFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLedgerData();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Open payout update modal
  const handleOpenPayoutModal = (settlement: ITripSettlement, partnerIdx: number) => {
    const list = parsePartnersBreakdown(settlement.partnersBreakdown);
    const partner = list[partnerIdx] || { status: 'paid', paymentMode: 'gpay', paymentRef: '', notes: '' };
    setSelectedSettlement(settlement);
    setSelectedPartnerIdx(partnerIdx);
    setPayoutForm({
      status: (partner.status as 'paid' | 'pending') || 'paid',
      paymentMode: partner.paymentMode || 'gpay',
      paymentRef: partner.paymentRef || '',
      notes: partner.notes || '',
    });
    setPayoutModalOpen(true);
  };

  // Submit payout update
  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettlement || selectedPartnerIdx === null) return;

    try {
      setUpdatingPayout(true);
      const list = parsePartnersBreakdown(selectedSettlement.partnersBreakdown);
      const partner = list[selectedPartnerIdx] || { name: 'Partner' };
      const res = await updatePartnerPayoutStatus(selectedSettlement.id, {
        partnerIndex: selectedPartnerIdx,
        partnerName: partner.name,
        status: payoutForm.status,
        paymentMode: payoutForm.paymentMode,
        paymentRef: payoutForm.paymentRef,
        notes: payoutForm.notes,
      });

      if (res.success) {
        toast.success(`Payout for ${partner.name} updated to ${payoutForm.status.toUpperCase()}!`);
        setPayoutModalOpen(false);
        loadLedgerData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update partner payout status');
    } finally {
      setUpdatingPayout(false);
    }
  };

  // Handle delete settlement
  const handleDeleteSettlement = async (id: number, code: string) => {
    if (!window.confirm(`Delete settlement record ${code}? This cannot be undone.`)) return;
    try {
      const res = await deleteTripSettlement(id);
      if (res.success) {
        toast.success(`Settlement ${code} deleted`);
        loadLedgerData();
      }
    } catch (err: any) {
      toast.error('Failed to delete settlement');
    }
  };

  // Copy WhatsApp breakdown for a specific settlement
  const handleCopyWhatsApp = (s: ITripSettlement) => {
    const list = parsePartnersBreakdown(s.partnersBreakdown);
    const partnerLines = list
      .map(
        (p) =>
          `• *${p.name}* (${p.sharePercent}%): *${formatINR(p.amount)}* [${
            p.status === 'paid' ? '✅ Paid' : '⏳ Pending'
          }]`
      )
      .join('\n');

    const text = `🏔️ *HILLS ANGEL - TRIP SETTLEMENT & COMMISSION*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Ref Code:* ${s.settlementCode}
📍 *Trip:* ${s.tripTitle} (${s.destination})
📅 *Date:* ${s.tripDate} | 👥 *Travellers:* ${s.numPersons} pax
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *Customer Revenue:* ${formatINR(s.tripRevenue)}

--- DIRECT TRIP EXPENSES ---
🏨 Stay Cost: ${formatINR(s.stayCost)} ${s.stayPartnerName ? `(${s.stayPartnerName})` : ''}
🍽️ Food Cost: ${formatINR(s.foodCost)} ${s.foodPartnerName ? `(${s.foodPartnerName})` : ''}
🚙 Fuel & Driver Bata: ${formatINR(s.transportCost)}
🎫 Misc & Permits: ${formatINR(s.miscCost)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Expenses: ${formatINR(s.totalExpenses)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 *NET ORGANIZING PROFIT:* ${formatINR(s.netProfit)} (${s.profitMarginPercent}% Margin)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

--- PARTNER PROFIT SHARE (பங்கு) ---
${partnerLines}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Settlement Status: ${s.overallStatus.toUpperCase()}_
_Generated via Hills Angel Admin Console_`;

    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    toast.success('WhatsApp settlement report copied!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handle manual settlement submit
  const handleSaveManualSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingManual(true);
      const totalExpenses =
        manualForm.stayCost + manualForm.foodCost + manualForm.transportCost + manualForm.miscCost;
      const netProfit = Math.max(0, manualForm.tripRevenue - totalExpenses);
      const profitMarginPercent =
        manualForm.tripRevenue > 0 ? Math.round((netProfit / manualForm.tripRevenue) * 100) : 0;

      // Default 50/50 split among 2 partners
      const partnersBreakdown: IPartnerPayoutItem[] = [
        {
          id: 'p1',
          name: 'Partner 1 (Mahesh)',
          sharePercent: 50,
          amount: Math.round(netProfit * 0.5),
          status: 'pending',
          paymentMode: 'gpay',
          paymentRef: '',
        },
        {
          id: 'p2',
          name: 'Partner 2 (Co-Organizer)',
          sharePercent: 50,
          amount: Math.round(netProfit * 0.5),
          status: 'pending',
          paymentMode: 'gpay',
          paymentRef: '',
        },
      ];

      const res = await saveTripSettlement({
        tripTitle: manualForm.tripTitle || `${manualForm.destination} Tour`,
        destination: manualForm.destination,
        tripDate: manualForm.tripDate,
        numPersons: manualForm.numPersons,
        numNights: manualForm.numNights,
        numDays: manualForm.numDays,
        tripRevenue: manualForm.tripRevenue,
        stayCost: manualForm.stayCost,
        stayPartnerName: manualForm.stayPartnerName || 'Direct Cottage',
        foodCost: manualForm.foodCost,
        foodPartnerName: manualForm.foodPartnerName || 'Direct Mess',
        transportCost: manualForm.transportCost,
        miscCost: manualForm.miscCost,
        totalExpenses,
        netProfit,
        profitMarginPercent,
        partnersBreakdown,
        overallStatus: 'pending',
        notes: manualForm.notes,
      });

      if (res.success) {
        toast.success('Trip settlement and commission breakdown recorded successfully!');
        setManualModalOpen(false);
        loadLedgerData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settlement');
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= 1. COMMISSION KPI BANNER ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Net Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Total Net Profit (நிகர லாபம்)
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#192D20] mt-1 block">
              {formatINR(stats?.totalNetProfit || 0)}
            </span>
            <span className="text-[11px] text-gray-500">
              Across {stats?.totalTrips || 0} completed trips
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Total Commission Distributed */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Total Partner Share
            </span>
            <span className="text-xl sm:text-2xl font-bold text-amber-600 mt-1 block">
              {formatINR(stats?.totalCommissionDistributed || 0)}
            </span>
            <span className="text-[11px] text-gray-500">
              Net profit distributed
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Commission Paid Out */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Paid Out (செலுத்தியது)
            </span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 block">
              {formatINR(stats?.totalPaidCommission || 0)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Settled to partners
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Total Commission Pending */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              Pending Payout (நிலுவை)
            </span>
            <span className="text-xl sm:text-2xl font-bold text-rose-600 mt-1 block">
              {formatINR(stats?.totalPendingCommission || 0)}
            </span>
            <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Awaiting settlement
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ================= 2. PARTNER-WISE COMMISSION SUMMARY CARDS ================= */}
      {stats?.partnerSummary && stats.partnerSummary.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-[#192D20] text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                  Partner-by-Partner Commission Breakdown
                </h3>
                <p className="text-xs text-gray-300">
                  Total profit earned, paid out, and balance pending for each organizer partner
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadLedgerData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-all self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Stats</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {stats.partnerSummary.map((partner, idx) => {
              const paidPercent =
                partner.totalEarned > 0
                  ? Math.round((partner.totalPaid / partner.totalEarned) * 100)
                  : 100;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{partner.name}</h4>
                      {partner.phone && (
                        <p className="text-[11px] text-gray-400">{partner.phone}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {partner.tripsCount} Trips
                    </span>
                  </div>

                  {/* Financial amounts */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 font-semibold block">
                        Total Share
                      </span>
                      <span className="text-xs font-bold text-white mt-0.5 block">
                        {formatINR(partner.totalEarned)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-emerald-400 font-semibold block">
                        Paid Out
                      </span>
                      <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                        {formatINR(partner.totalPaid)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-rose-400 font-semibold block">
                        Pending
                      </span>
                      <span className="text-xs font-bold text-rose-400 mt-0.5 block">
                        {formatINR(partner.totalPending)}
                      </span>
                    </div>
                  </div>

                  {/* Payout Progress */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-gray-300 mb-1">
                      <span>Payout Status</span>
                      <span className="font-bold text-amber-300">{paidPercent}% Paid</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick filter by this partner */}
                  <button
                    type="button"
                    onClick={() => setPartnerFilter(partner.name)}
                    className="w-full text-center py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-200 hover:text-white transition-colors"
                  >
                    View {partner.name}&apos;s Trips
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= 3. CONTROLS, SEARCH & ACTIONS ================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-serif font-bold text-base text-[#192D20]">
              Trip Settlement & Commission Records (ட்ரிப் கணக்குகள்)
            </h3>
            <p className="text-xs text-gray-500">
              Complete history of trips, revenue, stay/food costs, net profit, and partner payout statuses
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToCalculator && (
              <button
                type="button"
                onClick={onSwitchToCalculator}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#192D20] text-xs font-semibold transition-all"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Go to Trip Calculator</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#192D20] hover:bg-[#264431] text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record Trip Manually</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search code, trip title, vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="settled">Settled (All Paid)</option>
              <option value="partial">Partial (Some Paid)</option>
              <option value="pending">Pending (Unpaid)</option>
            </select>
          </div>

          {/* Partner Filter */}
          <div>
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Partners</option>
              {stats?.partnerSummary?.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Filter */}
          <div>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Destinations</option>
              <option value="Munnar">Munnar</option>
              <option value="Kodaikanal">Kodaikanal</option>
              <option value="Ooty">Ooty</option>
              <option value="Valparai">Valparai</option>
              <option value="Wayanad">Wayanad</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= 4. SETTLEMENT RECORDS LIST ================= */}
      {loading ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-gray-500 font-medium mt-2">
            Loading trip settlements & partner commissions...
          </span>
        </div>
      ) : settlements.length === 0 ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <Receipt className="w-10 h-10 text-gray-400 mb-2" />
          <h4 className="font-bold text-gray-800 text-sm">No settlement records found</h4>
          <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
            No settlements match the current filters. Calculate a trip and save it, or record one manually.
          </p>
          {onSwitchToCalculator && (
            <button
              type="button"
              onClick={onSwitchToCalculator}
              className="px-4 py-2 rounded-xl bg-[#192D20] text-white text-xs font-semibold hover:bg-[#25422F]"
            >
              Open Trip Calculator
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {settlements.map((s) => {
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header bar */}
                <div className="p-4 sm:p-5 bg-gray-50/60 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Receipt className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-500">
                          {s.settlementCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            s.overallStatus === 'settled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.overallStatus === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.overallStatus === 'settled'
                            ? 'All Paid (செட்டில் செய்யப்பட்டது)'
                            : s.overallStatus === 'partial'
                            ? 'Partially Paid'
                            : 'Pending Payout (நிலுவை)'}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-base text-[#192D20] mt-0.5">
                        {s.tripTitle}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {s.tripDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {s.numPersons} Guests ({s.numDays}D / {s.numNights}N)
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-gray-700">{s.destination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleCopyWhatsApp(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                      title="Copy WhatsApp Statement"
                    >
                      {copiedId === s.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === s.id ? 'Copied' : 'WhatsApp'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSettlement(s.id, s.settlementCode)}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete settlement record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 font-bold block">
                        Customer Revenue
                      </span>
                      <span className="text-sm sm:text-base font-bold text-gray-900 mt-0.5 block">
                        {formatINR(s.tripRevenue)}
                      </span>
                      <span className="text-[10px] text-gray-500">Gross collected</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-rose-500 font-bold block">
                        Direct Expenses
                      </span>
                      <span className="text-sm sm:text-base font-bold text-rose-600 mt-0.5 block">
                        {formatINR(s.totalExpenses)}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Stay + Food + Fuel
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-emerald-600 font-bold block">
                        Net Profit (நிகர லாபம்)
                      </span>
                      <span className="text-sm sm:text-base font-bold text-emerald-600 mt-0.5 block">
                        {formatINR(s.netProfit)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {s.profitMarginPercent}% Margin
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-gray-400 font-bold block">
                        Vendors Involved
                      </span>
                      <span className="text-xs text-gray-700 font-medium truncate block mt-0.5">
                        🏨 {s.stayPartnerName || 'Stay'} ({formatINR(s.stayCost)})
                      </span>
                      <span className="text-xs text-gray-700 font-medium truncate block">
                        🍽️ {s.foodPartnerName || 'Food'} ({formatINR(s.foodCost)})
                      </span>
                    </div>
                  </div>

                  {/* Partner Commission Distribution Section */}
                  <div>
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-2.5">
                      Partner Profit Split & Payout Tracking:
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {parsePartnersBreakdown(s.partnersBreakdown).map((partner, pIdx) => {
                        const isPaid = partner.status === 'paid';

                        return (
                          <div
                            key={partner.id || pIdx}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isPaid
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-amber-50/40 border-amber-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-900">
                                {partner.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isPaid ? 'Paid' : 'Pending'}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between mt-1.5">
                              <span className="text-lg font-black text-gray-900 font-mono">
                                {formatINR(partner.amount)}
                              </span>
                              <span className="text-xs font-semibold text-gray-500 font-mono">
                                {partner.sharePercent}% Share
                              </span>
                            </div>

                            {/* Payout Details */}
                            <div className="mt-2 pt-2 border-t border-gray-200/60 text-[11px] text-gray-600 flex items-center justify-between">
                              {isPaid ? (
                                <div className="truncate">
                                  <span className="text-emerald-700 font-semibold block">
                                    Via {partner.paymentMode?.toUpperCase()}
                                  </span>
                                  {partner.paymentRef && (
                                    <span className="text-[10px] text-gray-500 truncate block">
                                      Ref: {partner.paymentRef}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-rose-600 font-medium">
                                  Awaiting payment transfer
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenPayoutModal(s, pIdx)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  isPaid
                                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                }`}
                              >
                                {isPaid ? 'Edit Payout' : 'Mark as Paid'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {s.notes && (
                    <p className="text-xs text-gray-500 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <strong>Notes:</strong> {s.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= 5. MARK AS PAID / UPDATE PAYOUT MODAL ================= */}
      {payoutModalOpen && selectedSettlement && selectedPartnerIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CreditCard className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif font-bold text-base text-gray-900">
                    Update Partner Payout
                  </h3>
                  <p className="text-xs text-gray-500">
                    {parsePartnersBreakdown(selectedSettlement.partnersBreakdown)[selectedPartnerIdx]?.name} •{' '}
                    {formatINR(
                      parsePartnersBreakdown(selectedSettlement.partnersBreakdown)[selectedPartnerIdx]?.amount || 0
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPayoutModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="space-y-4">
              {/* Status Radio */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Payout Status *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      payoutForm.status === 'paid'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payoutStatus"
                      value="paid"
                      checked={payoutForm.status === 'paid'}
                      onChange={() => setPayoutForm({ ...payoutForm, status: 'paid' })}
                      className="sr-only"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Paid (செலுத்தப்பட்டது)</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      payoutForm.status === 'pending'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payoutStatus"
                      value="pending"
                      checked={payoutForm.status === 'pending'}
                      onChange={() => setPayoutForm({ ...payoutForm, status: 'pending' })}
                      className="sr-only"
                    />
                    <Clock className="w-4 h-4 text-rose-600" />
                    <span>Pending (நிலுவை)</span>
                  </label>
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={payoutForm.paymentMode}
                  onChange={(e) => setPayoutForm({ ...payoutForm, paymentMode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="gpay">Google Pay (GPay)</option>
                  <option value="phonepe">PhonePe</option>
                  <option value="paytm">Paytm</option>
                  <option value="upi">Other UPI</option>
                  <option value="bank">Bank IMPS / NEFT</option>
                  <option value="cash">Direct Cash</option>
                </select>
              </div>

              {/* Payment Reference */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Transaction / UPI Reference ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/261016123456 or Bank Ref #..."
                  value={payoutForm.paymentRef}
                  onChange={(e) => setPayoutForm({ ...payoutForm, paymentRef: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Settlement Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sent via Mahesh personal account"
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPayout}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#192D20] text-white text-xs font-semibold hover:bg-[#25422F] disabled:opacity-50"
                >
                  {updatingPayout && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Payout Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 6. RECORD TRIP MANUALLY MODAL ================= */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#192D20]/10 text-[#192D20]">
                  <Receipt className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif font-bold text-base text-gray-900">
                    Record Trip Settlement & Commission
                  </h3>
                  <p className="text-xs text-gray-500">
                    Log an offline trip to automatically track expenses and partner net profit shares
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualSettlement} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Trip / Tour Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Munnar 3D/2N Corporate Group"
                    value={manualForm.tripTitle}
                    onChange={(e) => setManualForm({ ...manualForm, tripTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Destination
                  </label>
                  <select
                    value={manualForm.destination}
                    onChange={(e) => setManualForm({ ...manualForm, destination: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="Munnar">Munnar</option>
                    <option value="Kodaikanal">Kodaikanal</option>
                    <option value="Ooty">Ooty</option>
                    <option value="Valparai">Valparai</option>
                    <option value="Wayanad">Wayanad</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Trip Date
                  </label>
                  <input
                    type="date"
                    value={manualForm.tripDate}
                    onChange={(e) => setManualForm({ ...manualForm, tripDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Guests (Pax)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.numPersons}
                    onChange={(e) => setManualForm({ ...manualForm, numPersons: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Customer Revenue (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={manualForm.tripRevenue}
                    onChange={(e) => setManualForm({ ...manualForm, tripRevenue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Stay Vendor Bill (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manualForm.stayCost}
                    onChange={(e) => setManualForm({ ...manualForm, stayCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Food Vendor Bill (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manualForm.foodCost}
                    onChange={(e) => setManualForm({ ...manualForm, foodCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Fuel & Driver Bata (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manualForm.transportCost}
                    onChange={(e) => setManualForm({ ...manualForm, transportCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Misc & Permits (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manualForm.miscCost}
                    onChange={(e) => setManualForm({ ...manualForm, miscCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Total Direct Expenses:</span>
                  <span className="font-bold text-rose-600">
                    {formatINR(manualForm.stayCost + manualForm.foodCost + manualForm.transportCost + manualForm.miscCost)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 text-sm pt-1 border-t border-emerald-200">
                  <span>Net Organizing Profit:</span>
                  <span>
                    {formatINR(
                      Math.max(
                        0,
                        manualForm.tripRevenue -
                          (manualForm.stayCost + manualForm.foodCost + manualForm.transportCost + manualForm.miscCost)
                      )
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#192D20] text-white text-xs font-semibold hover:bg-[#25422F] disabled:opacity-50"
                >
                  {savingManual && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save to Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
