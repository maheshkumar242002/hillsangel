import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Download,
  MessageCircle,
  Eye,
  X,
  Calculator,
  Zap,
  CheckCircle2,
  Loader2,
  Camera,
  Car,
  Fuel,
  Gauge,
  User,
  ShieldCheck,
  Maximize2,
  Key,
  UserCheck,
} from 'lucide-react';
import {
  getBookings,
  updateBookingStatus,
  sendCustomerWhatsApp,
  getExportBookingsCsvUrl,
} from '../../api/bookings';
import {
  getTripSettlements,
  autoCalculateBookingProfit,
  autoSettleAllBookings,
} from '../../api/partners';
import {
  Button,
  Input,
  Select,
  Modal,
  Table,
  Badge,
  TierBadge,
  CategoryChip,
} from '../../components/common';
import BookingCardTSX from '../../components/booking/BookingCardTSX';
import TripStartInspectionModal from '../../components/booking/TripStartInspectionModal';
import { formatINR, formatDate } from '../../utils/formatters';
import { openWhatsAppSafely } from '../../utils/whatsapp';
import toast from 'react-hot-toast';
import { IBooking, BookingStatus } from '../../types';

export default function AdminBookings(): React.ReactElement {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');

  // Settlement Tracking map (bookingId -> settlementCode)
  const [settlementMap, setSettlementMap] = useState<Record<string, string>>({});
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [autoSettlingAll, setAutoSettlingAll] = useState<boolean>(false);

  // Detail Modal State & Inspection Modal State
  const [activeBooking, setActiveBooking] = useState<IBooking | null>(null);
  const [tripStartModalBooking, setTripStartModalBooking] = useState<IBooking | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fetchBookings = async (): Promise<void> => {
    setLoading(true);
    try {
      const [res, settlementsRes] = await Promise.all([
        getBookings({
          search,
          status: filterStatus,
          category: filterCategory,
          tier: filterTier,
          limit: 100,
        }),
        getTripSettlements().catch(() => null),
      ]);

      if (res.success) {
        setBookings(res.bookings || []);
      }

      if (settlementsRes?.success && settlementsRes.settlements) {
        const map: Record<string, string> = {};
        settlementsRes.settlements.forEach((s) => {
          if (s.bookingId) map[s.bookingId] = s.settlementCode;
        });
        setSettlementMap(map);
      }
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [search, filterStatus, filterCategory, filterTier]);

  const handleStatusChange = async (id: string, newStatus: string): Promise<void> => {
    // If admin is starting the trip, trigger vehicle condition inspection & photo verification modal
    if (newStatus === 'in_progress') {
      const targetBooking = bookings.find((b) => b._id === id || b.id === id);
      if (targetBooking) {
        setTripStartModalBooking(targetBooking);
        return;
      }
    }

    try {
      const res = await updateBookingStatus(id, { status: newStatus as BookingStatus });
      if (res.success) {
        toast.success(res.message || `Booking status updated to ${newStatus}`);
        setBookings((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status: newStatus as BookingStatus } : b))
        );
        if (activeBooking && activeBooking._id === id) {
          setActiveBooking((prev) => (prev ? { ...prev, status: newStatus as BookingStatus } : null));
        }
        if ((res as any).settlement) {
          setSettlementMap((prev) => ({
            ...prev,
            [res.booking?.bookingId || '']: (res as any).settlement.settlementCode,
          }));
        }
      }
    } catch (err) {
      toast.error('Failed to update booking status');
    }
  };

  const handleTripStarted = (updatedBooking: IBooking) => {
    setBookings((prev) =>
      prev.map((b) =>
        b._id === updatedBooking._id || b.bookingId === updatedBooking.bookingId
          ? updatedBooking
          : b
      )
    );
    if (
      activeBooking &&
      (activeBooking._id === updatedBooking._id || activeBooking.bookingId === updatedBooking.bookingId)
    ) {
      setActiveBooking(updatedBooking);
    }
  };

  const handleQuickSettle = async (booking: IBooking): Promise<void> => {
    try {
      setSettlingId(booking.bookingId);
      const res = await autoCalculateBookingProfit({
        bookingId: booking.bookingId,
        saveToLedger: true,
      });

      if (res.success && res.data.savedSettlement) {
        const code = res.data.savedSettlement.settlementCode;
        toast.success(
          `⚡ Settled in Ledger (${code})! Net Profit: ${formatINR(res.data.financials.netProfit)}`
        );
        setSettlementMap((prev) => ({
          ...prev,
          [booking.bookingId]: code,
        }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to auto-settle booking');
    } finally {
      setSettlingId(null);
    }
  };

  const handleAutoSettleAll = async (): Promise<void> => {
    try {
      setAutoSettlingAll(true);
      const res = await autoSettleAllBookings();
      if (res.success) {
        toast.success(res.message);
        fetchBookings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to auto-settle trips');
    } finally {
      setAutoSettlingAll(false);
    }
  };

  const handleSendCustomerWhatsApp = async (booking: IBooking): Promise<void> => {
    try {
      const res = await sendCustomerWhatsApp(booking._id);
      if (res.success && res.whatsappUrl) {
        toast.success('Customer confirmation generated');
        openWhatsAppSafely(res.whatsappUrl);
        setBookings((prev) =>
          prev.map((b) => (b._id === booking._id ? { ...b, whatsappSent: true } : b))
        );
      }
    } catch (err) {
      toast.error('Failed to generate WhatsApp confirmation');
    }
  };

  const handleExportCsv = (): void => {
    window.open(getExportBookingsCsvUrl(), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & CSV Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-text">
            Customer Bookings
          </h2>
          <p className="text-xs text-muted">
            Manage traveler reservations, update confirmation statuses, and dispatch WhatsApp itineraries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="warning"
            onClick={handleAutoSettleAll}
            loading={autoSettlingAll}
            leftIcon={<Zap className="w-4 h-4 fill-current" />}
            title="⚡ Auto-calculate and create settlement accounts for all unsettled bookings"
          >
            {autoSettlingAll ? 'Settling...' : '⚡ Auto-Settle All Trips'}
          </Button>

          <Button
            variant="secondary"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4 text-primary" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-xs items-center">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by Booking ID, customer name, phone, or package..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-muted" />}
            onClear={search ? () => setSearch('') : undefined}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            containerClassName="w-full sm:w-44"
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'in_progress', label: 'Trip Started' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />

          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            containerClassName="w-full sm:w-36"
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'family', label: 'Family Trip' },
              { value: 'friends', label: 'Friends Trip' },
            ]}
          />

          <Select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            containerClassName="w-full sm:w-36"
            options={[
              { value: 'all', label: 'All Tiers' },
              { value: 'premium', label: 'Premium' },
              { value: 'extra_premium', label: 'Extra Premium' },
            ]}
          />
        </div>
      </div>

      {/* MOBILE CARD VIEW (< 768px) with TSX Component */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {bookings.map((b) => (
          <BookingCardTSX
            key={b._id}
            booking={b}
            onStatusChange={handleStatusChange}
            onWhatsAppCustomer={handleSendCustomerWhatsApp}
            onViewDetails={(selected) => setActiveBooking(selected)}
          />
        ))}
      </div>

      {/* DESKTOP TABLE VIEW (>= 768px) */}
      <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs min-w-[1150px]">
            <thead>
              <tr className="border-b border-gray-100 text-muted uppercase bg-surface/50 text-[11px] tracking-wider">
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Booking ID</th>
                <th className="py-3.5 px-4 min-w-[140px]">Customer</th>
                <th className="py-3.5 px-4 min-w-[200px]">Package</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Travel Date</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[90px]">Total</th>
                <th className="py-3.5 px-4 min-w-[170px]">Status</th>
                <th className="py-3.5 px-4 min-w-[150px]">Accounts Settlement</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[170px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary-dark whitespace-nowrap">
                    {b.bookingId}
                  </td>
                  <td className="py-3 px-4 min-w-[140px]">
                    <p className="font-semibold text-text">{b.customerName}</p>
                    <p className="text-[11px] text-muted">{b.phone}</p>
                  </td>
                  <td className="py-3 px-4 min-w-[200px] max-w-xs">
                    {b.bookingType === 'vehicle_rental_without_driver' || b.customFeatures?.rentalOption === 'without_driver' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 mb-1">
                        <Key className="w-3 h-3 text-purple-600" />
                        <span>Self-Drive Rental</span>
                      </span>
                    ) : b.bookingType === 'vehicle_rental_with_driver' || b.customFeatures?.rentalOption === 'with_driver' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span>Rental (With Driver)</span>
                      </span>
                    ) : null}
                    <p className="truncate font-medium text-text">{b.packageSnapshot?.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CategoryChip category={b.packageSnapshot?.category} showLabel={false} />
                      <TierBadge tier={b.packageSnapshot?.tier} size="sm" />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted whitespace-nowrap">{formatDate(b.travelDate)}</td>
                  <td className="py-3 px-4 font-bold text-primary-dark whitespace-nowrap">
                    {formatINR(b.totalPrice)}
                  </td>
                  <td className="py-3 px-4 min-w-[170px]">
                    <div className="flex flex-col gap-1">
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusChange(b._id, e.target.value)}
                        className={`text-[11px] font-bold uppercase rounded-lg px-2 py-1 border border-gray-200 focus:outline-none cursor-pointer transition-all ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-800'
                            : b.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-800 border-blue-300 font-extrabold shadow-xs'
                            : b.status === 'completed'
                            ? 'bg-purple-50 text-purple-800'
                            : b.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">Trip Started (In Progress)</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      {b.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-bold px-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                          On Tour (Active)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 min-w-[150px]">
                    {settlementMap[b.bookingId] ? (
                      <Link
                        to="/admin/company-partners?tab=ledger"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100 transition-all font-mono shadow-xs whitespace-nowrap"
                        title="Settlement account created in Ledger. Click to open."
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{settlementMap[b.bookingId]}</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickSettle(b)}
                        disabled={settlingId === b.bookingId}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-95 whitespace-nowrap"
                        title="⚡ 1-Click Auto-Generate Settlement using pre-set rates"
                      >
                        {settlingId === b.bookingId ? (
                          <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                        ) : (
                          <Zap className="w-3 h-3 text-amber-600 fill-current" />
                        )}
                        <span>{settlingId === b.bookingId ? 'Settling...' : '⚡ Settle Trip'}</span>
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right min-w-[170px] whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {b.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => setTripStartModalBooking(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-[11px] font-bold hover:shadow-xs transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
                          title="Start Trip & Capture Vehicle Condition Photos"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Start Trip</span>
                        </button>
                      )}

                      {b.status === 'in_progress' && b.startInspection && (
                        <button
                          type="button"
                          onClick={() => setActiveBooking(b)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-[10px] font-bold transition-all shadow-xs shrink-0"
                          title="View Pre-Trip Inspection Photos"
                        >
                          <Camera className="w-3 h-3 text-blue-600" />
                          <span>Photos</span>
                        </button>
                      )}

                      <Link
                        to={`/admin/company-partners?tab=calculator&bookingId=${b._id}`}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-all"
                        title="⚡ Auto-Calculate Partner Profit using pre-entered rates"
                      >
                        <Calculator className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleSendCustomerWhatsApp(b)}
                        className="p-1.5 text-[#25D366] hover:bg-emerald-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Send WhatsApp confirmation to customer"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveBooking(b)}
                        className="p-1.5 text-primary hover:bg-primary-light/50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="View booking details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOOKING DETAILS MODAL */}
      <Modal
        isOpen={Boolean(activeBooking)}
        onClose={() => setActiveBooking(null)}
        title={
          activeBooking ? (
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-primary-dark bg-primary-light/40 px-2.5 py-1 rounded-lg">
                {activeBooking.bookingId}
              </span>
              <span>Booking Information</span>
            </div>
          ) : (
            'Booking Information'
          )
        }
        subtitle="Full guest reservation, vehicle condition photos & partner profit split"
        size="lg"
      >
        {activeBooking && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-surface border border-gray-200 space-y-1.5">
              <span className="font-semibold text-text block text-sm">
                {activeBooking.packageSnapshot?.title}
              </span>
              <div className="flex items-center gap-2">
                <CategoryChip category={activeBooking.packageSnapshot?.category} />
                <TierBadge tier={activeBooking.packageSnapshot?.tier} size="sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-muted block text-[11px]">Lead Guest</span>
                <span className="font-bold text-text">{activeBooking.customerName}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-muted block text-[11px]">Phone</span>
                <span className="font-bold text-text">{activeBooking.phone}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-muted block text-[11px]">Travel Date</span>
                <span className="font-bold text-text">{formatDate(activeBooking.travelDate)}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-muted block text-[11px]">Guests</span>
                <span className="font-bold text-text">{activeBooking.persons}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-muted block text-[11px]">Pickup Location</span>
              <span className="font-bold text-text">{activeBooking.pickupLocation}</span>
            </div>

            {activeBooking.transportVehicle?.name && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                <span className="text-emerald-800 block text-[11px] font-semibold">🚗 Chosen Transport Vehicle</span>
                <span className="font-bold text-text text-xs block">{activeBooking.transportVehicle.name}</span>
                <span className="text-emerald-700 text-[10px] block">
                  {activeBooking.transportVehicle.price ? `Tariff: +${formatINR(activeBooking.transportVehicle.price)}` : 'Included in base package'}
                </span>
              </div>
            )}

            {activeBooking.customFeatures?.drivingLicenseNumber && (
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                <span className="text-purple-800 block text-[11px] font-semibold flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-purple-600" />
                  <span>Self-Drive Verification Details</span>
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-700">Driving License:</span>
                  <span className="font-mono font-bold text-xs text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200">
                    {activeBooking.customFeatures.drivingLicenseNumber}
                  </span>
                </div>
                <span className="text-[10px] text-purple-700 block mt-1">
                  Security Deposit: ₹3,000 (Refundable upon vehicle inspection at return)
                </span>
              </div>
            )}

            {activeBooking.rentalAssets && activeBooking.rentalAssets.length > 0 && (
              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                <span className="text-amber-800 block text-[11px] font-semibold">⛺ Rental Gear & Equipment Add-ons</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {activeBooking.rentalAssets.map((asset, idx) => (
                    <span key={idx} className="bg-white border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium text-amber-900">
                      {asset.name} (+{formatINR(asset.rentPrice)})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeBooking.specialRequests && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-muted block text-[11px]">Notes / Special Requests</span>
                <span className="text-text">{activeBooking.specialRequests}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-primary-light/40 border border-primary/20 flex items-center justify-between">
              <span className="font-semibold text-text">Total Trip Value:</span>
              <span className="text-lg font-bold text-primary-dark">
                {formatINR(activeBooking.totalPrice)}
              </span>
            </div>

            {/* PRE-TRIP VEHICLE CONDITION & INSPECTION DETAILS */}
            {activeBooking.startInspection ? (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Pre-Trip Vehicle Condition & Inspection Photos</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Verified at Start
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-muted block text-[10px]">Assigned Vehicle</span>
                    <span className="font-bold text-text">
                      {activeBooking.startInspection.vehicleName || 'Safari Vehicle'}
                    </span>
                    <span className="text-emerald-700 block text-[10px] font-mono font-bold">
                      {activeBooking.startInspection.vehicleReg}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-muted block text-[10px]">Mountain Pilot</span>
                    <span className="font-bold text-text">
                      {activeBooking.startInspection.driverName || 'Pilot'}
                    </span>
                    <span className="text-muted block text-[10px]">
                      {activeBooking.startInspection.driverPhone}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-muted block text-[10px]">Starting Odometer</span>
                    <span className="font-mono font-bold text-text">
                      {activeBooking.startInspection.odometerKm} KM
                    </span>
                  </div>

                  <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                    <span className="text-muted block text-[10px]">Fuel Level</span>
                    <span className="font-bold text-emerald-700">
                      {activeBooking.startInspection.fuelLevel || '100%'}
                    </span>
                  </div>
                </div>

                {/* Condition Photos Gallery */}
                {activeBooking.startInspection.photos && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-900 block">
                      Captured Condition Photos:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {Object.entries(activeBooking.startInspection.photos).map(([key, url]) => {
                        if (!url || typeof url !== 'string') return null;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setPreviewPhoto(url)}
                            className="group relative aspect-video rounded-xl overflow-hidden border border-emerald-200 bg-black/5 hover:border-emerald-500 transition-all cursor-pointer shadow-xs"
                          >
                            <img src={url} alt={key} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-medium py-0.5 px-1 truncate capitalize">
                              {key}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeBooking.startInspection.remarks && (
                  <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 text-[11px]">
                    <span className="text-muted block text-[10px] font-semibold">Remarks / Scratches Recorded:</span>
                    <span className="text-text">{activeBooking.startInspection.remarks}</span>
                  </div>
                )}
              </div>
            ) : activeBooking.status === 'confirmed' ? (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-900 block text-xs">Ready for Safari Departure?</span>
                  <span className="text-[11px] text-blue-700">Take vehicle condition photos to start trip</span>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  leftIcon={<Camera className="w-3.5 h-3.5" />}
                  onClick={() => setTripStartModalBooking(activeBooking)}
                >
                  Start Trip & Photos
                </Button>
              </div>
            ) : null}

            {/* Status Update & WhatsApp Button */}
            <div className="pt-2 space-y-2">
              <Link
                to={`/admin/company-partners?tab=calculator&bookingId=${activeBooking._id}`}
                className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-xs"
              >
                <Calculator className="w-4 h-4" />
                <span>⚡ Auto-Generate Partner Profit Split (ஹோட்டல் & உணவக லாப பகிர்வு)</span>
              </Link>

              <Button
                variant="success"
                fullWidth
                size="md"
                className="!bg-[#25D366] hover:!bg-[#20ba59]"
                leftIcon={<MessageCircle className="w-4 h-4 fill-current" />}
                onClick={() => handleSendCustomerWhatsApp(activeBooking)}
              >
                Send Confirmation WhatsApp to Customer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* TRIP START INSPECTION MODAL */}
      {tripStartModalBooking && (
        <TripStartInspectionModal
          booking={tripStartModalBooking}
          isOpen={Boolean(tripStartModalBooking)}
          onClose={() => setTripStartModalBooking(null)}
          onTripStarted={handleTripStarted}
        />
      )}

      {/* FULL PHOTO PREVIEW LIGHTBOX */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewPhoto}
              alt="Vehicle Condition"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
