import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Receipt,
  Car,
  Boxes,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Copy,
  Check,
  Eye,
  X,
  UploadCloud,
  Loader2,
  Fuel,
  Wrench,
  Shield,
  FileCheck,
  Disc,
  Sparkles,
  ArrowRight,
  TrendingDown,
  UserCheck,
  CreditCard,
  Layers,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getExpenses,
  getExpenseStats,
  createExpense,
  updateExpense,
  reimburseExpense,
  deleteExpense,
  uploadReceiptImage,
} from '../../api/expenses';
import { useVehicleStore } from '../../store';
import { getAssets } from '../../api/assets';
import {
  IAssetExpense,
  IExpenseStats,
  ExpenseCategory,
  ExpensePaymentMode,
  ExpenseStatus,
  IVehicleMaster,
  IAsset,
} from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';

interface PartnerOption {
  id: string;
  name: string;
  phone?: string;
  upiId?: string;
}

interface AssetExpenseLedgerProps {
  companyPartners?: PartnerOption[];
  preSelectedVehicleId?: string | number;
  preSelectedAssetId?: string | number;
  onRefreshTrigger?: () => void;
}

const defaultPartners: PartnerOption[] = [
  { id: 'p1', name: 'Partner 1 (Mohan)', phone: '9876543210', upiId: 'mohan@okaxis' },
  { id: 'p2', name: 'Partner 2 (Co-Organizer)', phone: '9845123456', upiId: 'partner2@okhdfcbank' },
];

export default function AssetExpenseLedger({
  companyPartners = defaultPartners,
  preSelectedVehicleId,
  preSelectedAssetId,
}: AssetExpenseLedgerProps): React.ReactElement {
  const [expenses, setExpenses] = useState<IAssetExpense[]>([]);
  const [stats, setStats] = useState<IExpenseStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Master Lists for Selection
  const { vehicles, fetchVehicles } = useVehicleStore();
  const [assets, setAssets] = useState<IAsset[]>([]);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<IAssetExpense | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingReceipt, setUploadingReceipt] = useState<boolean>(false);

  // Reimburse Modal State
  const [reimburseModalOpen, setReimburseModalOpen] = useState<boolean>(false);
  const [selectedExpenseToReimburse, setSelectedExpenseToReimburse] = useState<IAssetExpense | null>(null);
  const [reimburseRef, setReimburseRef] = useState<string>('');
  const [reimburseNotes, setReimburseNotes] = useState<string>('');
  const [submittingReimburse, setSubmittingReimburse] = useState<boolean>(false);

  // Image Preview Modal
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [copiedStatement, setCopiedStatement] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'fuel' as ExpenseCategory,
    entityType: 'vehicle' as 'vehicle' | 'asset' | 'general',
    vehicleId: preSelectedVehicleId ? String(preSelectedVehicleId) : '',
    assetId: preSelectedAssetId ? String(preSelectedAssetId) : '',
    amount: '' as string | number,
    expenseDate: new Date().toISOString().split('T')[0],
    odometerKm: '' as string | number,
    paidByPartnerId: companyPartners[0]?.id || 'p1',
    paidByPartnerName: companyPartners[0]?.name || 'Managing Partner',
    paymentMode: 'gpay_upi' as ExpensePaymentMode,
    paymentRef: '',
    receiptUrl: '',
    status: 'pending_reimbursement' as ExpenseStatus,
    notes: '',
  });

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [expRes, statsRes] = await Promise.all([
        getExpenses({
          search,
          paidByPartnerId: partnerFilter,
          entityType: entityFilter,
          category: categoryFilter,
          status: statusFilter,
          vehicleId: preSelectedVehicleId,
          assetId: preSelectedAssetId,
        }),
        getExpenseStats().catch(() => null),
      ]);

      if (expRes.success) {
        setExpenses(expRes.expenses || []);
      }
      if (statsRes?.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Failed to load expenses', err);
      toast.error('Failed to load expense records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (vehicles.length === 0) fetchVehicles();
    getAssets({ status: 'all' })
      .then((res) => {
        if (res.success) setAssets(res.assets || []);
      })
      .catch(() => {});
  }, [partnerFilter, entityFilter, categoryFilter, statusFilter]);

  const handleOpenCreateModal = (targetVehicleId?: string | number, targetAssetId?: string | number) => {
    setEditingExpense(null);
    setFormData({
      title: '',
      category: 'fuel',
      entityType: targetAssetId ? 'asset' : 'vehicle',
      vehicleId: targetVehicleId ? String(targetVehicleId) : (vehicles[0]?._id || vehicles[0]?.id ? String(vehicles[0]._id || vehicles[0].id) : ''),
      assetId: targetAssetId ? String(targetAssetId) : '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      odometerKm: '',
      paidByPartnerId: companyPartners[0]?.id || 'p1',
      paidByPartnerName: companyPartners[0]?.name || 'Managing Partner',
      paymentMode: 'gpay_upi',
      paymentRef: '',
      receiptUrl: '',
      status: 'pending_reimbursement',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp: IAssetExpense) => {
    setEditingExpense(exp);
    setFormData({
      title: exp.title,
      category: exp.category,
      entityType: exp.entityType,
      vehicleId: exp.vehicleId ? String(exp.vehicleId) : '',
      assetId: exp.assetId ? String(exp.assetId) : '',
      amount: exp.amount,
      expenseDate: exp.expenseDate,
      odometerKm: exp.odometerKm || '',
      paidByPartnerId: exp.paidByPartnerId,
      paidByPartnerName: exp.paidByPartnerName,
      paymentMode: exp.paymentMode,
      paymentRef: exp.paymentRef || '',
      receiptUrl: exp.receiptUrl || '',
      status: exp.status,
      notes: exp.notes || '',
    });
    setIsModalOpen(true);
  };

  const handlePartnerSelect = (partnerId: string) => {
    if (partnerId === 'company') {
      setFormData((prev) => ({
        ...prev,
        paidByPartnerId: 'company',
        paidByPartnerName: 'Company Direct Account',
        status: 'direct_company',
      }));
    } else {
      const p = companyPartners.find((item) => String(item.id) === String(partnerId));
      setFormData((prev) => ({
        ...prev,
        paidByPartnerId: partnerId,
        paidByPartnerName: p ? p.name : 'Managing Partner',
        status: prev.status === 'direct_company' ? 'pending_reimbursement' : prev.status,
      }));
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('receipt', file);
    setUploadingReceipt(true);

    try {
      const res = await uploadReceiptImage(data);
      if (res.success && res.fileUrl) {
        setFormData((prev) => ({ ...prev, receiptUrl: res.fileUrl! }));
        toast.success('Bill / Receipt photo uploaded!');
      }
    } catch (err) {
      toast.error('Failed to upload receipt image');
    } finally {
      setUploadingReceipt(false);
      e.target.value = '';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter expense description');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    setSaving(true);
    try {
      const selectedVehicle = vehicles.find((v) => String(v._id || v.id) === String(formData.vehicleId));
      const selectedAsset = assets.find((a) => String(a._id || a.id) === String(formData.assetId));

      const payload: Partial<IAssetExpense> = {
        title: formData.title.trim(),
        category: formData.category,
        entityType: formData.entityType,
        vehicleId: formData.entityType === 'vehicle' && selectedVehicle ? (Number(selectedVehicle.id) || undefined) : null,
        vehicleReg: formData.entityType === 'vehicle' && selectedVehicle ? selectedVehicle.regNumber : undefined,
        vehicleName: formData.entityType === 'vehicle' && selectedVehicle ? selectedVehicle.name : undefined,
        assetId: formData.entityType === 'asset' && selectedAsset ? (Number(selectedAsset.id) || undefined) : null,
        assetCode: formData.entityType === 'asset' && selectedAsset ? selectedAsset.assetCode : undefined,
        assetName: formData.entityType === 'asset' && selectedAsset ? selectedAsset.name : undefined,
        amount: Number(formData.amount),
        expenseDate: formData.expenseDate,
        odometerKm: formData.odometerKm ? Number(formData.odometerKm) : null,
        paidByPartnerId: formData.paidByPartnerId,
        paidByPartnerName: formData.paidByPartnerName,
        paymentMode: formData.paymentMode,
        paymentRef: formData.paymentRef.trim(),
        receiptUrl: formData.receiptUrl,
        status: formData.status,
        notes: formData.notes.trim(),
      };

      if (editingExpense) {
        const id = editingExpense._id || editingExpense.id!;
        await updateExpense(id, payload);
        toast.success('Expense record updated successfully');
      } else {
        await createExpense(payload);
        toast.success('New asset/vehicle expense recorded in Accounts!');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenReimburseModal = (exp: IAssetExpense) => {
    setSelectedExpenseToReimburse(exp);
    setReimburseRef('');
    setReimburseNotes('');
    setReimburseModalOpen(true);
  };

  const handleConfirmReimburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpenseToReimburse) return;

    setSubmittingReimburse(true);
    try {
      const id = selectedExpenseToReimburse._id || selectedExpenseToReimburse.id!;
      await reimburseExpense(id, {
        status: 'reimbursed',
        reimbursementRef: reimburseRef.trim(),
        notes: reimburseNotes.trim(),
      });
      toast.success(
        `✅ Reimbursed ${formatINR(selectedExpenseToReimburse.amount)} to ${selectedExpenseToReimburse.paidByPartnerName}!`
      );
      setReimburseModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark as reimbursed');
    } finally {
      setSubmittingReimburse(false);
    }
  };

  const handleDeleteExpense = async (id: string | number, code: string) => {
    if (!window.confirm(`Are you sure you want to delete expense record ${code}?`)) return;
    try {
      await deleteExpense(id);
      toast.success('Expense record deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  const handleCopyWhatsAppPartnerReport = (partnerName?: string) => {
    const filtered = partnerName
      ? expenses.filter((e) => e.paidByPartnerName.toLowerCase().includes(partnerName.toLowerCase()))
      : expenses;

    if (filtered.length === 0) {
      toast.error('No expense records to export');
      return;
    }

    const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
    const pending = filtered
      .filter((e) => e.status === 'pending_reimbursement')
      .reduce((s, e) => s + Number(e.amount), 0);
    const reimbursed = filtered
      .filter((e) => e.status === 'reimbursed')
      .reduce((s, e) => s + Number(e.amount), 0);

    const lines = filtered.slice(0, 15).map((e) => {
      const entity = e.vehicleReg || e.assetName || 'General';
      const statusIcon = e.status === 'reimbursed' ? '✅ Reimbursed' : '⏳ Pending';
      return `• ${e.expenseDate} | *${entity}*: ${e.title} - *${formatINR(e.amount)}* (${e.paidByPartnerName}) [${statusIcon}]`;
    });

    const report = `📋 *HILLS ANGEL - ASSET & VEHICLE EXPENSE STATEMENT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${partnerName ? `👤 *Partner Accounts Detail:* ${partnerName}\n` : ''}💰 *Total Expenses Recorded:* ${formatINR(total)}
⏳ *Pending Reimbursement:* ${formatINR(pending)}
✅ *Settled / Reimbursed:* ${formatINR(reimbursed)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Recent Expense Transactions:*
${lines.join('\n')}
${filtered.length > 15 ? `\n_...and ${filtered.length - 15} more records._` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Accounts Ledger • Hills Angel Tours & Safaris_`;

    navigator.clipboard.writeText(report);
    setCopiedStatement(true);
    toast.success('Partner expense statement copied to clipboard!');
    setTimeout(() => setCopiedStatement(false), 2500);
  };

  const getCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'fuel':
        return <Fuel className="w-4 h-4 text-amber-500" />;
      case 'service_maintenance':
      case 'repair_parts':
        return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'insurance':
        return <Shield className="w-4 h-4 text-emerald-500" />;
      case 'fc_permit':
        return <FileCheck className="w-4 h-4 text-purple-500" />;
      case 'tyres':
        return <Disc className="w-4 h-4 text-slate-600" />;
      default:
        return <Receipt className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-700">
              <TrendingDown className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#192D20]">
                Asset & Vehicle Expense Ledger (சொத்து & வாகன செலவுகள்)
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Track every expense on vehicles and assets with exact partner attribution and reimbursement accounts
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopyWhatsAppPartnerReport()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Copy formatted expense summary for WhatsApp"
          >
            {copiedStatement ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedStatement ? 'Copied!' : 'Copy Statement'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal(preSelectedVehicleId, preSelectedAssetId)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log New Expense</span>
          </button>
        </div>
      </div>

      {/* PARTNER ACCOUNTS SUMMARY CARDS */}
      {stats && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-[#192D20] uppercase tracking-wider">
                Partner Out-of-Pocket Expense Accounts (பார்ட்னர் வாரியாக செலவுகள்)
              </h3>
            </div>
            <span className="text-xs text-gray-500">
              Total Expenses: <strong>{formatINR(stats.totalExpenseAmount)}</strong> across {stats.totalTransactions} bills
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.partnerAccounts.map((account) => {
              const hasPending = account.pendingReimbursement > 0;
              return (
                <div
                  key={account.partnerId}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs flex flex-col justify-between transition-all ${
                    hasPending ? 'border-amber-200 ring-1 ring-amber-200/50' : 'border-gray-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 font-bold flex items-center justify-center text-sm">
                          {account.partnerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#192D20] line-clamp-1">{account.partnerName}</h4>
                          <span className="text-[11px] text-gray-500">{account.expenseCount} recorded expenses</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          hasPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {hasPending ? 'Pending Refund' : 'All Settled'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-500 block">Total Spent:</span>
                        <span className="text-sm font-bold text-gray-900">{formatINR(account.totalPaid)}</span>
                      </div>
                      <div className="border-l border-gray-200 pl-2">
                        <span className="text-[10px] uppercase font-semibold text-emerald-700 block">Reimbursed:</span>
                        <span className="text-sm font-bold text-emerald-700">{formatINR(account.reimbursed)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-gray-600 font-medium">Due to Partner (நிறுவனம் தரவேண்டியது):</span>
                      <span className={`font-bold text-sm ${hasPending ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatINR(account.pendingReimbursement)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPartnerFilter(account.partnerId)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                    >
                      Filter bills ({account.expenseCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppPartnerReport(account.partnerName)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                      title="Send statement to partner on WhatsApp"
                    >
                      WhatsApp Statement
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick Fleet Running Cost Card */}
            {stats.vehicleBreakdown && stats.vehicleBreakdown.length > 0 && (
              <div className="bg-gradient-to-br from-[#192D20] to-[#243e2d] text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-4 h-4 text-emerald-300" />
                    <h4 className="font-bold text-sm text-white">Vehicle Running Cost</h4>
                  </div>
                  <p className="text-[11px] text-gray-300 mb-3">
                    Total fuel & maintenance across registered fleet
                  </p>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-xs">
                    {stats.vehicleBreakdown.map((vb) => (
                      <div key={vb.vehicleReg} className="flex items-center justify-between py-1 border-b border-white/10">
                        <span className="font-mono text-amber-300 font-bold text-[11px]">{vb.vehicleReg}</span>
                        <span className="font-bold text-white">{formatINR(vb.totalExpense)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-emerald-300 text-right">
                  Vehicles: {stats.vehicleBreakdown.length} units
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses by bill code, vehicle (KL 68 C 3024), partner, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Partner Filter */}
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Partners (அனைத்து பார்ட்னர்)</option>
              {companyPartners.map((p) => (
                <option key={p.id} value={p.id}>
                  👤 {p.name}
                </option>
              ))}
              <option value="company">🏢 Company Direct</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Categories</option>
              <option value="fuel">⛽ Fuel / Diesel</option>
              <option value="service_maintenance">🔧 Service & Maintenance</option>
              <option value="repair_parts">⚙️ Spare Parts / Repairs</option>
              <option value="insurance">🛡️ Insurance Renewal</option>
              <option value="fc_permit">📜 FC & Permits</option>
              <option value="tyres">🔘 Tyres</option>
              <option value="washing_cleaning">🚿 Washing & Cleaning</option>
              <option value="toll_fastag">🛣️ Toll & FASTag</option>
              <option value="gear_equipment">⛺ Gear & Equipment</option>
              <option value="other">📦 Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Statuses</option>
              <option value="pending_reimbursement">⏳ Pending Reimbursement</option>
              <option value="reimbursed">✅ Reimbursed (Settled)</option>
              <option value="direct_company">🏢 Direct Company</option>
            </select>

            {(partnerFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || search) && (
              <button
                type="button"
                onClick={() => {
                  setPartnerFilter('all');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setSearch('');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 underline font-semibold px-2 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EXPENSE RECORDS TABLE */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs text-gray-500">Loading expense accounts ledger...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 space-y-3">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto stroke-1" />
          <h4 className="text-base font-bold text-gray-800">No expenses recorded</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No expense records found matching current filters. Click below to log your first diesel, service, or gear expense!
          </p>
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Log New Expense
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Date & Code</th>
                  <th className="py-3 px-4">Entity (Vehicle / Asset)</th>
                  <th className="py-3 px-4">Expense Title & Category</th>
                  <th className="py-3 px-4">Paid By (Partner)</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((exp) => {
                  const isPending = exp.status === 'pending_reimbursement';
                  const isReimbursed = exp.status === 'reimbursed';

                  return (
                    <tr key={exp._id || exp.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Date & Code */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-gray-900 block">{exp.expenseCode}</span>
                        <span className="text-[11px] text-gray-500">{formatDate(exp.expenseDate)}</span>
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4">
                        {exp.entityType === 'vehicle' ? (
                          <div className="flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <div>
                              <span className="font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[11px]">
                                {exp.vehicleReg || 'Vehicle'}
                              </span>
                              {exp.vehicleName && (
                                <span className="text-[11px] text-gray-500 block truncate max-w-[140px]">
                                  {exp.vehicleName}
                                </span>
                              )}
                              {exp.odometerKm && (
                                <span className="text-[10px] text-gray-400 block">{exp.odometerKm.toLocaleString()} km</span>
                              )}
                            </div>
                          </div>
                        ) : exp.entityType === 'asset' ? (
                          <div className="flex items-center gap-1.5">
                            <Boxes className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <div>
                              <span className="font-semibold text-gray-800">{exp.assetName || 'Gear/Asset'}</span>
                              {exp.assetCode && (
                                <span className="text-[10px] text-gray-500 block font-mono">{exp.assetCode}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-[11px]">General Expense</span>
                        )}
                      </td>

                      {/* Title & Category */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(exp.category)}
                          <span className="font-bold text-gray-900 truncate">{exp.title}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 capitalize block mt-0.5">
                          {exp.category.replace('_', ' ')}
                        </span>
                        {exp.notes && (
                          <span className="text-[10px] text-gray-400 italic line-clamp-1 mt-0.5">{exp.notes}</span>
                        )}
                      </td>

                      {/* Paid By Partner */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                            {exp.paidByPartnerName.slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <span className="font-bold text-gray-800 block text-[11px]">{exp.paidByPartnerName}</span>
                            <span className="text-[10px] text-gray-500 capitalize">
                              {exp.paymentMode.replace('_', ' ')}
                              {exp.paymentRef ? ` • ${exp.paymentRef}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-sm text-gray-900 block">{formatINR(exp.amount)}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isReimbursed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isPending && <Clock className="w-3 h-3" />}
                          {isReimbursed && <CheckCircle2 className="w-3 h-3" />}
                          <span>{exp.status.replace('_', ' ')}</span>
                        </span>
                        {exp.reimbursedAt && (
                          <span className="text-[9px] text-gray-400 block mt-0.5">
                            Settled {formatDate(exp.reimbursedAt)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {exp.receiptUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewReceiptUrl(exp.receiptUrl!)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                              title="View Bill Receipt"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleOpenReimburseModal(exp)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition-colors flex items-center gap-1"
                              title="Settle / Reimburse partner for this expense"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Settle</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp._id || exp.id!, exp.expenseCode)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ================= MODAL 1: LOG / EDIT EXPENSE ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-gray-900">
                  {editingExpense ? 'Edit Expense Record' : 'Log Asset / Vehicle Expense (செலவு பதிவு)'}
                </h3>
                <p className="text-xs text-gray-500">Record maintenance, fuel, insurance, or repairs with partner attribution.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Entity Type & Target Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Expense On (எதில் செலவு?)</label>
                  <select
                    value={formData.entityType}
                    onChange={(e) => setFormData({ ...formData, entityType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="vehicle">🚗 Vehicle / Fleet</option>
                    <option value="asset">⛺ Gear / Asset</option>
                    <option value="general">📦 General Operations</option>
                  </select>
                </div>

                {formData.entityType === 'vehicle' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Vehicle</label>
                    <select
                      value={formData.vehicleId}
                      onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map((v) => (
                        <option key={v._id || v.id} value={v._id || v.id}>
                          {v.regNumber} — {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : formData.entityType === 'asset' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Asset / Gear</label>
                    <select
                      value={formData.assetId}
                      onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">-- Choose Asset --</option>
                      {assets.map((a) => (
                        <option key={a._id || a.id} value={a._id || a.id}>
                          {a.assetCode} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div />
                )}
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Description / Bill Title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50L Diesel Top-up or 40K Service"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Expense Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="fuel">⛽ Fuel / Diesel</option>
                    <option value="service_maintenance">🔧 Service & Maintenance</option>
                    <option value="repair_parts">⚙️ Spare Parts / Repairs</option>
                    <option value="insurance">🛡️ Insurance Renewal</option>
                    <option value="fc_permit">📜 FC & Permits</option>
                    <option value="tyres">🔘 Tyres</option>
                    <option value="washing_cleaning">🚿 Washing & Cleaning</option>
                    <option value="toll_fastag">🛣️ Toll & FASTag</option>
                    <option value="gear_equipment">⛺ Gear / Amenity</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>
              </div>

              {/* Amount, Date & Odometer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Amount (₹) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="4500"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Odometer (KM)</label>
                  <input
                    type="number"
                    placeholder="e.g. 48200"
                    value={formData.odometerKm}
                    onChange={(e) => setFormData({ ...formData, odometerKm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* CRITICAL: PAID BY PARTNER (பார்ட்னர் யார் செலவு செய்தார்?) */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  🤝 Paid By (எந்த பார்ட்னர் பணம் செலுத்தினார்?)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Partner Attribution</label>
                    <select
                      value={formData.paidByPartnerId}
                      onChange={(e) => handlePartnerSelect(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {companyPartners.map((p) => (
                        <option key={p.id} value={p.id}>
                          👤 {p.name} {p.upiId ? `(${p.upiId})` : ''}
                        </option>
                      ))}
                      <option value="company">🏢 Company Direct Account (Direct Expense)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Payment Mode</label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="gpay_upi">📱 GPay / PhonePe / UPI</option>
                      <option value="cash">💵 Cash Out-of-Pocket</option>
                      <option value="bank_transfer">🏦 Bank NEFT/IMPS</option>
                      <option value="credit_card">💳 Credit Card</option>
                      <option value="company_account">🏢 Company Account</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      UPI Txn ID / Bill / Invoice No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI Ref 329048123 or Bill #104"
                      value={formData.paymentRef}
                      onChange={(e) => setFormData({ ...formData, paymentRef: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Reimbursement Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                    >
                      <option value="pending_reimbursement">⏳ Pending Reimbursement (Company owes partner)</option>
                      <option value="reimbursed">✅ Reimbursed / Settled</option>
                      <option value="direct_company">🏢 Direct Company Expense</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Receipt / Bill Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bill Receipt Photo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors">
                    <UploadCloud className="w-4 h-4 text-emerald-700" />
                    <span>{uploadingReceipt ? 'Uploading...' : 'Upload Bill Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      disabled={uploadingReceipt}
                      className="hidden"
                    />
                  </label>

                  {formData.receiptUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Uploaded
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewReceiptUrl(formData.receiptUrl)}
                        className="text-xs text-emerald-700 underline"
                      >
                        Preview
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Additional remarks, workshop name, parts replaced..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingExpense ? 'Update Record' : 'Save Expense Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: SETTLE / REIMBURSE TO PARTNER ================= */}
      {reimburseModalOpen && selectedExpenseToReimburse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-base text-gray-900">
                  Reimburse Partner (பணம் பட்டுவாடா)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReimburseModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Expense Code:</span>
                <span className="font-mono font-bold text-gray-900">{selectedExpenseToReimburse.expenseCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Partner to Pay:</span>
                <span className="font-bold text-emerald-800">{selectedExpenseToReimburse.paidByPartnerName}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-emerald-200">
                <span className="font-bold text-gray-800">Reimbursement Amount:</span>
                <span className="font-black text-emerald-700">{formatINR(selectedExpenseToReimburse.amount)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmReimburse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Settlement Transaction Ref / UPI ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via GPay Ref 402910398"
                  value={reimburseRef}
                  onChange={(e) => setReimburseRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Settlement Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Reimbursed from company bank account"
                  value={reimburseNotes}
                  onChange={(e) => setReimburseNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReimburseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReimburse}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingReimburse ? 'Processing...' : 'Confirm Reimbursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: RECEIPT PREVIEW LIGHTBOX ================= */}
      {previewReceiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setPreviewReceiptUrl(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] bg-black rounded-2xl overflow-hidden p-2">
            <button
              type="button"
              onClick={() => setPreviewReceiptUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewReceiptUrl}
              alt="Receipt Bill"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

