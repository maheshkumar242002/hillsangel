import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import confetti from 'canvas-confetti';
import { CheckCircle2, MessageCircle, ArrowRight, Calendar, User, MapPin, Sparkles, Car, Tent } from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';
import { openWhatsAppSafely } from '../utils/whatsapp';
import TierBadge from '../components/common/TierBadge';
import CategoryChip from '../components/common/CategoryChip';
import { IBooking } from '../types';

interface LocationState {
  booking?: IBooking;
  whatsappUrl?: string;
}

export default function BookingSuccess(): React.ReactElement {
  const location = useLocation();
  const { booking, whatsappUrl } = (location.state as LocationState) || {};

  // Trigger celebration confetti
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4A7C59', '#A8C686', '#C9A227', '#F3D77A'],
    });
  }, []);

  if (!booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-text">No Recent Booking Found</h2>
        <p className="text-xs text-muted">
          Looking for your booking details? Please check your WhatsApp messages or browse our hill packages.
        </p>
        <Link
          to="/packages"
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold"
        >
          <span>Browse Packages</span>
        </Link>
      </div>
    );
  }

  const handleOpenWhatsApp = (): void => {
    if (whatsappUrl) {
      openWhatsAppSafely(whatsappUrl);
    }
  };

  return (
    <>
      <Helmet>
        <title>Booking Confirmed | Hills Angel Tours and Travels</title>
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        {/* Celebration Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm animate-in zoom-in duration-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Booking Received
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-text">
            Pack Your Bags! 🌿
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
            Your booking request has been securely recorded. Our coordinator will finalize your itinerary and driver details.
          </p>
        </div>

        {/* Primary Booking ID Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-elaichi space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-3">
            <div>
              <span className="text-xs text-muted block">Official Booking Reference:</span>
              <span className="text-2xl sm:text-3xl font-bold text-primary-dark tracking-wide font-mono">
                {booking.bookingId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CategoryChip category={booking.packageSnapshot?.category} />
              <TierBadge tier={booking.packageSnapshot?.tier} />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted block text-[11px]">Tour Package</span>
                <span className="font-semibold text-text">{booking.packageSnapshot?.title}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted block text-[11px]">Travel Date</span>
                <span className="font-semibold text-text">{formatDate(booking.travelDate)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted block text-[11px]">Lead Traveler</span>
                <span className="font-semibold text-text">{booking.customerName} ({booking.persons} Persons)</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted block text-[11px]">Pickup Location</span>
                <span className="font-semibold text-text">{booking.pickupLocation}</span>
              </div>
            </div>

            {booking.transportVehicle?.name && (
              <div className="flex items-start gap-2.5">
                <Car className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted block text-[11px]">Transport Vehicle</span>
                  <span className="font-semibold text-text">{booking.transportVehicle.name}</span>
                </div>
              </div>
            )}

            {booking.rentalAssets && booking.rentalAssets.length > 0 && (
              <div className="flex items-start gap-2.5 sm:col-span-2">
                <Tent className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted block text-[11px]">Rental Gear Add-ons</span>
                  <span className="font-semibold text-text">
                    {booking.rentalAssets.map((a) => a.name).join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-surface border border-primary/20 flex items-center justify-between">
            <span className="text-xs font-semibold text-text">Total Trip Value:</span>
            <span className="text-xl font-bold text-primary-dark">
              {formatINR(booking.totalPrice)}
            </span>
          </div>

          {/* WhatsApp Direct Action Button (POPUP BLOCKER FALLBACK) */}
          <div className="space-y-3 pt-2">
            {whatsappUrl && (
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full min-h-[50px] py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Chat with Coordinator on WhatsApp</span>
              </button>
            )}

            <p className="text-[11px] text-muted text-center leading-relaxed">
              If WhatsApp did not open automatically, tap the green button above to send your prefilled booking summary directly.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
          >
            <span>Return to Hills Angel Homepage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}
