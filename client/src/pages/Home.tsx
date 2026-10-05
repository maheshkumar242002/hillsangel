import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Compass,
  Heart,
  Users,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  PhoneCall,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { getFeaturedPackages, getDestinations } from '../api/packages';
import PackageCard from '../components/packages/PackageCard';
import BookingModal from '../components/booking/BookingModal';
import { PackageGridSkeleton } from '../components/common/Skeleton';
import { useSettings } from '../context/SettingsContext';
import { getWhatsAppUrl } from '../utils/whatsapp';
import { IPackage } from '../types';

export default function Home(): React.ReactElement {
  const [featuredPackages, setFeaturedPackages] = useState<IPackage[]>([]);
  const [, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBookingPkg, setSelectedBookingPkg] = useState<IPackage | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const [pkgRes, destRes] = await Promise.all([
          getFeaturedPackages(),
          getDestinations(),
        ]);
        if (pkgRes.success) setFeaturedPackages(pkgRes.packages || []);
        if (destRes.success) setDestinations(destRes.destinations || []);
      } catch (err) {
        console.error('Failed to load home page packages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openBooking = (pkg: IPackage): void => {
    setSelectedBookingPkg(pkg);
    setBookingModalOpen(true);
  };

  const whatsappDirect = getWhatsAppUrl(
    settings.whatsappNumber,
    '🌿 Hello Hills Angel Tours! I would like to plan a custom hill station trip.'
  );

  return (
    <>
      <Helmet>
        <title>Hills Angel Tours and Travels | Hill-Station Trips & Honeymoons</title>
        <meta
          name="description"
          content="Explore handcrafted hill station tour packages for couples and solo groups in Ooty, Munnar, and Kodaikanal. Premium & Extra Premium comfort."
        />
      </Helmet>

      <div className="space-y-16 md:space-y-24 pb-16">
        {/* ================= HERO SECTION ================= */}
        <section className="relative min-h-[92dvh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden">
          {/* Hero Background Image with misty green gradient overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={settings.hero?.bannerImage || 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1920&q=80'}
              alt="Misty Hill-Station Valley"
              className="w-full h-full object-cover object-center scale-105 animate-in fade-in duration-1000"
            />
            {/* Dark green Elaichi gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#142318] via-[#1F3D27]/80 to-black/40" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-white">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium mb-6 animate-in slide-in-from-top duration-500">
              <Sparkles className="w-4 h-4 text-gold-light" />
              <span>{settings.hero?.badgeText || 'Curated Hill-Station Retreats'}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight drop-shadow-md">
              {settings.hero?.title || 'Discover the Mist-Clad Peaks of South India'}
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-200 mb-8 sm:mb-10 font-normal leading-relaxed drop-shadow">
              {settings.hero?.subtitle ||
                'Handcrafted journeys for couples seeking romantic tranquility and solo wanderers craving shared group trails.'}
            </p>

            {/* Hero CTAs (Min 44x44px Tap Targets) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
              <Link
                to="/packages"
                className="w-full sm:w-auto min-h-[50px] px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-primary to-primary-dark text-white font-semibold shadow-elaichi-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Book Your Trip</span>
                <ArrowRight className="w-4 h-4 text-accent-light" />
              </Link>

              <a
                href={whatsappDirect}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[50px] px-6 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold border border-white/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4 text-accent-light" />
                <span>Talk to Travel Expert</span>
              </a>
            </div>

            {/* Quick Pill Highlights */}
            <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-gray-200">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Private Couple Retreats</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <span>Stranger Solo Trails</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-gold-light" />
                <span>Premium & Extra-Premium Tiers</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CATEGORY CARDS (COUPLE VS STRANGER) ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Couple Package Feature Card */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-900/90 via-[#2C1920] to-[#1F2D24] text-white p-6 sm:p-10 shadow-elaichi flex flex-col justify-between min-h-[320px] group">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-200">
                  <Heart className="w-3.5 h-3.5 fill-rose-300 text-rose-300" />
                  <span>Private Couple Packages</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                  Honeymoons & Romantic Escapes
                </h3>
                <p className="text-xs sm:text-sm text-rose-100/80 leading-relaxed max-w-md">
                  Private dedicated cab, intimate valley-view resorts, candlelit dinners, and scenic serenity built exclusively for two.
                </p>
              </div>

              <div className="relative z-10 pt-6">
                <Link
                  to="/packages?category=couple"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-rose-600/80 hover:bg-rose-600 px-5 py-2.5 rounded-xl transition-colors min-h-[44px]"
                >
                  <span>Explore Couple Trips</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Decorative Subtle Background image */}
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 pointer-events-none group-hover:scale-105 transition-transform duration-700">
                <img
                  src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Stranger Package Feature Card */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E3A2B] via-[#193024] to-[#122018] text-white p-6 sm:p-10 shadow-elaichi flex flex-col justify-between min-h-[320px] group">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-200">
                  <Users className="w-3.5 h-3.5 text-accent" />
                  <span>Stranger Group Trails</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                  Solo Travelers Joining Together
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-md">
                  Shared AC tempo traveller, cozy group stays, night campfires, guided treks, and lifelong friendships in the hills.
                </p>
              </div>

              <div className="relative z-10 pt-6">
                <Link
                  to="/packages?category=stranger"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-5 py-2.5 rounded-xl transition-colors min-h-[44px]"
                >
                  <span>Explore Stranger Trails</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 pointer-events-none group-hover:scale-105 transition-transform duration-700">
                <img
                  src="https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURED PACKAGES ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Handcrafted Itineraries
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-text mt-1">
                Featured Hill Getaways
              </h2>
            </div>
            <Link
              to="/packages"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors self-start sm:self-auto min-h-[44px]"
            >
              <span>View All 12 Packages</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <PackageGridSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredPackages.map((pkg) => (
                <PackageCard key={pkg._id || pkg.id} pkg={pkg} onBookNow={openBooking} />
              ))}
            </div>
          )}
        </section>

        {/* ================= POPULAR DESTINATIONS ================= */}
        <section className="bg-surface py-16 sm:py-20 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                The Crown Jewels
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-text mt-1">
                Popular Hill Stations
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-2">
                Pick your dream landscape—from fragrant Nilgiri tea estates to misty high-altitude lakes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ooty Card */}
              <Link
                to="/packages?destination=Ooty"
                className="group relative rounded-3xl overflow-hidden aspect-[4/3] shadow-elaichi focus:outline-none focus:ring-4 focus:ring-primary/20"
              >
                <img
                  src="https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80"
                  alt="Ooty"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-xs font-medium text-accent block">Queen of Hill Stations</span>
                  <h3 className="font-serif text-2xl font-bold">Ooty, Nilgiris</h3>
                  <p className="text-xs text-gray-200 mt-1">Toy train, botanical gardens & Doddabetta</p>
                </div>
              </Link>

              {/* Munnar Card */}
              <Link
                to="/packages?destination=Munnar"
                className="group relative rounded-3xl overflow-hidden aspect-[4/3] shadow-elaichi focus:outline-none focus:ring-4 focus:ring-primary/20"
              >
                <img
                  src="https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80"
                  alt="Munnar"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-xs font-medium text-accent block">Tea Country & Cascades</span>
                  <h3 className="font-serif text-2xl font-bold">Munnar, Kerala</h3>
                  <p className="text-xs text-gray-200 mt-1">Kolukkumalai sunrise & cardamom valleys</p>
                </div>
              </Link>

              {/* Kodaikanal Card */}
              <Link
                to="/packages?destination=Kodaikanal"
                className="group relative rounded-3xl overflow-hidden aspect-[4/3] shadow-elaichi focus:outline-none focus:ring-4 focus:ring-primary/20"
              >
                <img
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                  alt="Kodaikanal"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-xs font-medium text-accent block">Princess of Hill Stations</span>
                  <h3 className="font-serif text-2xl font-bold">Kodaikanal, Tamil Nadu</h3>
                  <p className="text-xs text-gray-200 mt-1">Star lake boating, pine forests & pillar rocks</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= HOW BOOKING WORKS (3 STEPS) ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Simple & Transparent
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-text mt-1">
              How Your Booking Works
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-2">
              Book effortlessly in 3 quick steps with instant WhatsApp confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary-dark font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-sm">
                1
              </div>
              <h3 className="font-serif text-lg font-bold text-text">Choose Your Package</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Select your preferred hill station, whether you're traveling as a Couple or joining a Stranger group, and pick between Premium or Extra Premium comfort.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary-dark font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-sm">
                2
              </div>
              <h3 className="font-serif text-lg font-bold text-text">Fill Quick Travel Form</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Enter your dates and pickup point. No upfront online payment required to reserve your departure dates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary-dark font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-sm">
                3
              </div>
              <h3 className="font-serif text-lg font-bold text-text">Instant WhatsApp Concierge</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                You are instantly connected to our hill-station coordinator on WhatsApp with your booking ID to customize vehicle pickups and receive driver details.
              </p>
            </div>
          </div>
        </section>

        {/* ================= WHY CHOOSE US ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#1C3224] to-[#122217] rounded-3xl text-white p-8 sm:p-14 shadow-elaichi-lg">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                The Hills Angel Promise
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold mt-1">
                Why Travelers Love Touring with Us
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-accent">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-base">100% Safe & Inspected</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Every resort, luxury villa, and vehicle is physically inspected and police-verified for traveler safety.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-accent">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-base">Transparent Pricing</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  No hidden driver allowances or night charges. What you see is what you pay.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-accent">
                  <Compass className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-base">Local Hill Experts</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Our chauffeurs and guides were born and raised in the Nilgiris and Western Ghats.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-accent">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-base">24/7 Trip Support</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Dedicated operations manager available on WhatsApp from departure until you return home safely.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= TESTIMONIALS (SWIPEABLE / CAROUSEL) ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Real Stories
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-text mt-1">
              What Our Travelers Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed">
                "Our Ooty Honeymoon Extra Premium trip was truly unforgettable. The private plunge pool villa and candlelight dinner under the stars exceeded all expectations!"
              </p>
              <div className="pt-2 border-t border-gray-100">
                <span className="font-semibold text-text text-xs block">Ananya & Karthik</span>
                <span className="text-[11px] text-muted block">Ooty Couple Retreat • Bengaluru</span>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed">
                "I was nervous joining the Stranger group alone as a solo female traveler. Hills Angel made everyone feel like old friends within hours. The Munnar 4x4 sunrise was magical!"
              </p>
              <div className="pt-2 border-t border-gray-100">
                <span className="font-semibold text-text text-xs block">Sneha Kulkarni</span>
                <span className="text-[11px] text-muted block">Munnar Stranger Trails • Mumbai</span>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed">
                "The instant WhatsApp coordination made booking so effortless. Driver Ramesh was punctual, courteous, and took us to secret viewpoints tourists never see."
              </p>
              <div className="pt-2 border-t border-gray-100">
                <span className="font-semibold text-text text-xs block">Devendra Menon</span>
                <span className="text-[11px] text-muted block">Kodaikanal Lakefront • Chennai</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= BOTTOM CTA BANNER ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-elaichi text-white p-8 sm:p-14 text-center shadow-elaichi-lg">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4 drop-shadow">
              Ready to Escape to the Hills?
            </h2>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-gray-100 mb-8 leading-relaxed">
              Book your customized couple escape or join the next stranger group expedition today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/packages"
                className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-white text-primary-dark font-bold shadow-md hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Browse All Packages</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappDirect}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-black/20 hover:bg-black/30 backdrop-blur-md text-white font-semibold border border-white/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Chat with Concierge</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Global Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedPackage={selectedBookingPkg}
      />
    </>
  );
}
