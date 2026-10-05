import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  MessageCircle,
  Eye,
  X,
} from 'lucide-react';
import {
  getBookings,
  updateBookingStatus,
  sendCustomerWhatsApp,
  getExportBookingsCsvUrl,
} from '../../api/bookings';
import TierBadge from '../../components/common/TierBadge';
import CategoryChip from '../../components/common/CategoryChip';
import BookingCardTSX from '../../components/booking/BookingCardTSX';
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

  // Detail Modal State
  const [activeBooking, setActiveBooking] = useState<IBooking | null>(null);

  const fetchBookings = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await getBookings({
        search,
        status: filterStatus,
        category: filterCategory,
        tier: filterTier,
        limit: 100,
      });
      if (res.success) {
        setBookings(res.bookings || []);
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
    try {
      const res = await updateBookingStatus(id, { status: newStatus as BookingStatus });
      if (res.success) {
        toast.success(`Booking status updated to ${newStatus}`);
        setBookings((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status: newStatus as BookingStatus } : b))
        );
        if (activeBooking && activeBooking._id === id) {
          setActiveBooking((prev) => (prev ? { ...prev, status: newStatus as BookingStatus } : null));
        }
      }
    } catch (err) {
      toast.error('Failed to update booking status');
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

        <button
          type="button"
          onClick={handleExportCsv}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-gray-200 text-text font-semibold text-xs shadow-sm hover:bg-surface flex items-center justify-center gap-2 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-primary" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Booking ID, customer name, phone, or package..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-text focus:outline-none min-h-[40px]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-surface border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-text focus:outline-none min-h-[40px]"
          >
            <option value="all">All Categories</option>
            <option value="couple">Couple</option>
            <option value="stranger">Stranger</option>
          </select>

          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="bg-surface border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-text focus:outline-none min-h-[40px]"
          >
            <option value="all">All Tiers</option>
            <option value="premium">Premium</option>
            <option value="extra_premium">Extra Premium</option>
          </select>
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
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-muted uppercase bg-surface/50">
              <th className="py-3.5 px-4">Booking ID</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Package</th>
              <th className="py-3.5 px-4">Travel Date</th>
              <th className="py-3.5 px-4">Total</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-primary-dark">
                  {b.bookingId}
                </td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-text">{b.customerName}</p>
                  <p className="text-[11px] text-muted">{b.phone}</p>
                </td>
                <td className="py-3 px-4 max-w-xs">
                  <p className="truncate font-medium text-text">{b.packageSnapshot?.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CategoryChip category={b.packageSnapshot?.category} showLabel={false} />
                    <TierBadge tier={b.packageSnapshot?.tier} size="sm" />
                  </div>
                </td>
                <td className="py-3 px-4 text-muted">{formatDate(b.travelDate)}</td>
                <td className="py-3 px-4 font-bold text-primary-dark">
                  {formatINR(b.totalPrice)}
                </td>
                <td className="py-3 px-4">
                  <select
                    value={b.status}
                    onChange={(e) => handleStatusChange(b._id, e.target.value)}
                    className={`text-[11px] font-bold uppercase rounded-lg px-2 py-1 border border-gray-200 focus:outline-none cursor-pointer ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-800'
                        : b.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-800'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
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

      {/* BOOKING DETAILS MODAL */}
      {activeBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-surface/50">
              <div>
                <span className="font-mono font-bold text-xs text-primary-dark">
                  {activeBooking.bookingId}
                </span>
                <h3 className="font-serif text-lg font-bold text-text">Booking Information</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveBooking(null)}
                className="p-2 text-gray-400 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs pb-safe">
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

              {/* Status Update & WhatsApp Button */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSendCustomerWhatsApp(activeBooking)}
                  className="w-full min-h-[48px] rounded-xl bg-[#25D366] text-white font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Send Confirmation WhatsApp to Customer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
