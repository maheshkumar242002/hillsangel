import React from 'react';
import { Eye, MessageCircle, Phone, MapPin, Calendar, Users } from 'lucide-react';
import { IBooking, BookingStatus } from '../../types';
import TierBadge from '../common/TierBadge';
import CategoryChip from '../common/CategoryChip';
import { formatINR, formatDate } from '../../utils/formatters';

export interface BookingCardTSXProps {
  booking: IBooking;
  onStatusChange?: (id: string, status: BookingStatus) => void;
  onWhatsAppCustomer?: (booking: IBooking) => void;
  onViewDetails?: (booking: IBooking) => void;
}

export const BookingCardTSX: React.FC<BookingCardTSXProps> = ({
  booking,
  onStatusChange,
  onWhatsAppCustomer,
  onViewDetails,
}) => {
  const bookingId = booking._id || booking.id || '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
      {/* Top Header: Booking ID & Status Dropdown */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs text-primary-dark tracking-wide bg-primary-light/40 px-2.5 py-1 rounded-lg">
            {booking.bookingId}
          </span>
          <CategoryChip
            category={booking.packageSnapshot?.category}
            showLabel={false}
          />
          <TierBadge
            tier={booking.packageSnapshot?.tier}
            size="sm"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={booking.status}
          onChange={(e) =>
            onStatusChange && onStatusChange(bookingId, e.target.value as BookingStatus)
          }
          className={`text-[11px] font-bold uppercase rounded-lg px-2.5 py-1 border border-gray-200 focus:outline-none cursor-pointer ${
            booking.status === 'confirmed'
              ? 'bg-emerald-50 text-emerald-800'
              : booking.status === 'cancelled'
              ? 'bg-rose-50 text-rose-800'
              : booking.status === 'completed'
              ? 'bg-blue-50 text-blue-800'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Customer Details Section */}
      <div className="space-y-1">
        <h4 className="font-bold text-text text-base">{booking.customerName}</h4>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <a href={`tel:${booking.phone}`} className="hover:underline font-medium">
              {booking.phone}
            </a>
          </span>
          {booking.email && (
            <span className="text-gray-400">
              • {booking.email}
            </span>
          )}
        </div>
      </div>

      {/* Package Snapshot & Logistics */}
      <div className="p-3.5 rounded-xl bg-surface border border-gray-100 text-xs space-y-2">
        <p className="font-semibold text-text">
          {booking.packageSnapshot?.title}
        </p>

        <div className="grid grid-cols-2 gap-2 text-muted text-[11px]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{formatDate(booking.travelDate)}</span>
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>{booking.persons} Guest(s)</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-muted text-[11px] pt-0.5">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate">Pickup: {booking.pickupLocation}</span>
        </div>
      </div>

      {/* Total Price & Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div>
          <span className="text-[10px] text-muted block leading-none">Total Amount:</span>
          <span className="text-base font-bold text-primary-dark">
            {formatINR(booking.totalPrice)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(booking)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-text hover:bg-surface flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>
          )}

          {onWhatsAppCustomer && (
            <button
              type="button"
              onClick={() => onWhatsAppCustomer(booking)}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#25D366] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCardTSX;
