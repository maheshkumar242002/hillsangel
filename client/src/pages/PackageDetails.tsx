import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Sparkles,
  PhoneCall,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { getPackageBySlug } from '../api/packages';
import PackageGallery from '../components/packages/PackageGallery';
import ItineraryAccordion from '../components/packages/ItineraryAccordion';
import CompareTiersTable from '../components/packages/CompareTiersTable';
import TierBadge from '../components/common/TierBadge';
import CategoryChip from '../components/common/CategoryChip';
import BookingModal from '../components/booking/BookingModal';
import { formatINR, formatDate } from '../utils/formatters';
import { useSettings } from '../context/SettingsContext';
import { getWhatsAppUrl } from '../utils/whatsapp';
import toast from 'react-hot-toast';
import { IPackage } from '../types';

export default function PackageDetails(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [pkg, setPkg] = useState<IPackage | null>(null);
  const [counterpart, setCounterpart] = useState<IPackage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchDetails = async (): Promise<void> => {
      if (!slug) return;
      setLoading(true);
      setError('');
      try {
        const res = await getPackageBySlug(slug);
        if (res.success && res.package) {
          setPkg(res.package);
          setCounterpart(res.counterpart || null);
        } else {
          setError('Package not found.');
        }
      } catch (err) {
        setError('Unable to load package details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const handleShare = (): void => {
    if (navigator.share) {
      navigator
        .share({
          title: pkg?.title || 'Hills Angel Package',
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Package link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted font-medium">Loading itinerary and mountain panoramas...</p>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-text">Package Not Found</h2>
        <p className="text-xs text-muted">{error || 'This tour package is no longer available.'}</p>
        <Link
          to="/packages"
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Packages</span>
        </Link>
      </div>
    );
  }

  const isStranger = pkg.category === 'stranger';
  const seatsLeft = pkg.seatsLeft !== undefined ? pkg.seatsLeft : Math.max(0, (pkg.maxSeats || 14) - (pkg.seatsBooked || 0));

  const whatsappDirect = getWhatsAppUrl(
    settings.whatsappNumber,
    `🌿 Hello Hills Angel Tours! I am interested in booking "${pkg.title}" (${formatINR(pkg.price)}). Can you share available departure slots?`
  );

  return (
    <>
      <Helmet>
        <title>{`${pkg.title} | Hills Angel Tours`}</title>
        <meta
          name="description"
          content={`Book ${pkg.title} in ${pkg.destination}. ${pkg.duration?.days} Days / ${pkg.duration?.nights} Nights of breathtaking hill station experiences.`}
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12 pb-24 md:pb-12">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/packages"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-primary transition-colors min-h-[40px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Packages</span>
            <span>/</span>
            <span className="text-text font-semibold">{pkg.destination}</span>
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="min-h-[44px] px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-text hover:bg-surface flex items-center gap-1.5 active:scale-95 transition-all"
            aria-label="Share this package"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        {/* Title & Badges Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <CategoryChip category={pkg.category} />
            <TierBadge tier={pkg.tier} size="md" />
            <span className="inline-flex items-center gap-1 text-xs text-muted font-medium bg-surface px-2.5 py-1 rounded-full border border-gray-200">
              <MapPin className="w-3 h-3 text-primary" />
              {pkg.destination}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-text">
            {pkg.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted pt-1">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>
                {pkg.duration?.days || 3} Days / {pkg.duration?.nights || 2} Nights
              </span>
            </span>

            {isStranger && (
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <Users className="w-4 h-4" />
                <span>{seatsLeft > 0 ? `${seatsLeft} Seats Remaining` : 'Batch Full'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Main Grid: Gallery & Booking Box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols): Gallery & Quick Highlights */}
          <div className="lg:col-span-2 space-y-6">
            <PackageGallery images={pkg.images} title={pkg.title} />

            {/* Highlights Grid */}
            {pkg.highlights && pkg.highlights.length > 0 && (
              <div className="bg-surface rounded-3xl p-6 border border-primary/20 space-y-3">
                <h3 className="font-serif font-bold text-base text-text flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Key Trip Highlights</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-gray-700">
                  {pkg.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Included Gear & Equipment Assets */}
            {pkg.includedAssets && pkg.includedAssets.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-3">
                <h3 className="font-serif font-bold text-base text-text flex items-center gap-2">
                  <span className="text-base">🎒</span>
                  <span>Included Gear & Mountain Equipment</span>
                </h3>
                <p className="text-xs text-muted">
                  The following travel equipment and assets are arranged and provided by Hills Angel for your journey:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {pkg.includedAssets.map((asset: any, idx: number) => {
                    const name = typeof asset === 'object' ? asset.name : asset;
                    const desc = typeof asset === 'object' ? asset.description : '';
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-surface border border-gray-100 flex items-start gap-2.5"
                      >
                        <div className="w-7 h-7 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark shrink-0 font-bold text-xs">
                          ✓
                        </div>
                        <div className="min-w-0">
                          <span className="block font-bold text-xs text-text">{name}</span>
                          {desc && <span className="text-[11px] text-muted line-clamp-1 block">{desc}</span>}
                          <span className="text-[10px] text-emerald-700 font-semibold block">Complimentary Included</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Desktop Booking Sticky Card */}
          <div className="hidden lg:block">
            <div className="sticky top-24 bg-white rounded-3xl border border-gray-100 p-6 shadow-elaichi space-y-6">
              <div>
                <span className="text-xs text-muted block font-medium">All-Inclusive Price:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary-dark">
                    {formatINR(pkg.price)}
                  </span>
                  {pkg.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatINR(pkg.originalPrice)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted block capitalize">
                  {pkg.priceUnit || (isStranger ? 'per person' : 'per couple')}
                </span>
              </div>

              {/* Available Departure Dates Preview */}
              {pkg.availableDates && pkg.availableDates.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Upcoming Departure Dates:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {pkg.availableDates.slice(0, 3).map((d, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium bg-surface text-primary-dark px-2.5 py-1 rounded-lg border border-gray-200"
                      >
                        {formatDate(d)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                type="button"
                onClick={() => setBookingModalOpen(true)}
                className="w-full min-h-[50px] py-3.5 rounded-2xl bg-gradient-elaichi text-white font-bold shadow-elaichi hover:shadow-elaichi-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Book This Package Now</span>
              </button>

              <a
                href={whatsappDirect}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] py-2.5 rounded-2xl border border-primary/30 text-primary-dark font-semibold text-xs hover:bg-primary-light/40 flex items-center justify-center gap-2 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-primary" />
                <span>Ask Questions on WhatsApp</span>
              </a>

              <p className="text-[11px] text-muted text-center leading-relaxed">
                No credit card needed. Instant direct confirmation with vehicle & driver details.
              </p>
            </div>
          </div>
        </div>

        {/* ================= COMPARE TIERS SECTION ================= */}
        {counterpart && (
          <section className="pt-4">
            <CompareTiersTable
              currentPackage={pkg}
              counterpartPackage={counterpart}
              onSelectPackage={(targetPkg: IPackage) => {
                navigate(`/packages/${targetPkg.slug}`);
              }}
            />
          </section>
        )}

        {/* ================= ITINERARY ACCORDION ================= */}
        <section className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-elaichi space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Day-by-Day Journey
            </span>
            <h2 className="text-2xl font-bold text-text">Tour Itinerary</h2>
          </div>

          <ItineraryAccordion itinerary={pkg.itinerary} />
        </section>

        {/* ================= INCLUSIONS & EXCLUSIONS ================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inclusions */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary font-serif font-bold text-lg">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>What's Included</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
              {pkg.inclusions?.map((inc, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Exclusions */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-serif font-bold text-lg">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>What's Not Included</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
              {pkg.exclusions?.map((exc, i) => (
                <li key={i} className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* ================= MOBILE STICKY BOTTOM ACTION BAR (CRITICAL) ================= */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 pb-safe md:hidden shadow-2xl flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] text-muted block leading-none">Starting from:</span>
          <span className="text-lg font-bold text-primary-dark">
            {formatINR(pkg.price)}
          </span>
          <span className="text-[10px] text-muted block">
            {pkg.priceUnit || (isStranger ? 'per person' : 'per couple')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setBookingModalOpen(true)}
          className="min-h-[48px] px-6 py-2.5 rounded-xl bg-gradient-elaichi text-white font-bold text-sm shadow-elaichi active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <span>Book Now</span>
        </button>
      </div>

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedPackage={pkg}
      />
    </>
  );
}
