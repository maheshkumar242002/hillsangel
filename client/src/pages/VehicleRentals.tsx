import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Car,
  Key,
  UserCheck,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  Calendar,
  CheckCircle2,
  Clock,
  Navigation,
  Compass,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Layers,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { useVehicleStore } from '../store';
import { useSettings } from '../context/SettingsContext';
import { formatINR } from '../utils/formatters';
import { getWhatsAppUrl } from '../utils/whatsapp';
import VehicleRentalModal from '../components/booking/VehicleRentalModal';
import { IVehicleMaster } from '../types';

export default function VehicleRentals(): React.ReactElement {
  const { settings } = useSettings();
  const { vehicles, loading, fetchVehicles } = useVehicleStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'jeep' | 'suv' | 'sedan' | 'van'>('all');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedRentalMode, setSelectedRentalMode] = useState<'with_driver' | 'without_driver'>('with_driver');
  const [preSelectedVehicleId, setPreSelectedVehicleId] = useState<string | number | undefined>(undefined);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const filteredVehicles = useMemo(() => {
    let list = vehicles.filter((v) => v.isAvailableForRental !== false);
    if (activeFilter !== 'all') {
      list = list.filter((v) => v.vehicleType === activeFilter);
    }
    return list;
  }, [vehicles, activeFilter]);

  const handleOpenRental = (mode: 'with_driver' | 'without_driver', vehicleId?: string | number) => {
    setSelectedRentalMode(mode);
    setPreSelectedVehicleId(vehicleId);
    setModalOpen(true);
  };

  const whatsappDirect = getWhatsAppUrl(
    settings.whatsappNumber,
    '🌿 Hello Hills Angel! I would like to enquire about renting a vehicle in Munnar.'
  );

  return (
    <>
      <Helmet>
        <title>Vehicle Rentals in Munnar – 4x4 Jeep & Car Hire | Hills Angel</title>
        <meta
          name="description"
          content="Rent private 4x4 safari jeeps, SUVs, sedans, and tempo travellers in Munnar with driver or self-drive. Best rates & verified fleet."
        />
      </Helmet>

      <div className="space-y-12 pb-16">
        {/* ================= HERO SECTION ================= */}
        <section className="relative bg-gradient-to-br from-[#122316] via-[#192D20] to-[#0D1810] text-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-amber-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>100% Real Fleet • With Driver & Self-Drive Options</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold font-serif tracking-tight text-white leading-tight">
                Private Vehicle Rentals in Munnar & Hill Corridors
              </h1>

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
                Explore Munnar, Kanthalloor, Vattavada, and ghat trails with complete peace of mind. Choose a certified mountain driver or drive yourself. Pure vehicle rental with zero fixed tour restrictions.
              </p>

              {/* Mode Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenRental('with_driver')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm shadow-xl active:scale-95 transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-emerald-100" />
                  <span>Rent With Mountain Driver</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenRental('without_driver')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/20 text-white border border-white/25 font-bold text-sm backdrop-blur-md shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Key className="w-4 h-4 text-amber-300" />
                  <span>Rent Self-Drive (Without Driver)</span>
                </button>
              </div>

              {/* Quick Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Commercial Comprehensive Insurance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Doorstep Hotel / Airport Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Instant WhatsApp Confirmation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Quick Paperless KYC</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FLEET SECTION ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header & Category Filter */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <Car className="w-4 h-4" />
                <span>Our Rental Fleet (வாகனங்கள்)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900 mt-1">
                Choose Your Ride for the Hills
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                All vehicles undergo strict 20-point pre-trip mechanical and cleanliness checks.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-2xl w-fit">
              {[
                { id: 'all', label: 'All Fleet' },
                { id: 'jeep', label: '4x4 Safari Jeeps' },
                { id: 'suv', label: 'SUVs & Crysta' },
                { id: 'sedan', label: 'Sedans' },
                { id: 'van', label: 'Tempo & Urbania' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-white text-[#192D20] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicles Grid */}
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-gray-500 font-medium">Loading verified fleet...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <h4 className="font-bold text-gray-800 text-sm">No vehicles found in this category</h4>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className="mt-2 text-xs text-emerald-700 font-semibold underline"
              >
                View all fleet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => {
                const photo = vehicle.imageUrl || (vehicle.images && vehicle.images[0]) || '';
                const dailyRate = vehicle.pricePerDay || 3200;

                return (
                  <div
                    key={vehicle._id || vehicle.id}
                    className="bg-white rounded-3xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Photo Banner */}
                      <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                        {photo ? (
                          <img
                            src={photo}
                            alt={vehicle.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Car className="w-12 h-12" />
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-400 text-gray-900 shadow-sm border border-amber-500">
                            {vehicle.regNumber}
                          </span>
                        </div>

                        {vehicle.badge && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-emerald-800 backdrop-blur-xs shadow-xs uppercase tracking-wider">
                              {vehicle.badge}
                            </span>
                          </div>
                        )}

                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] drop-shadow-md">
                          <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                            💺 {vehicle.seatingCapacity} Passengers
                          </span>
                          <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs uppercase">
                            {vehicle.fuelType}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                            {vehicle.categoryLabel || vehicle.vehicleType}
                          </span>
                          <h3 className="font-serif font-bold text-base sm:text-lg text-gray-900 line-clamp-1">
                            {vehicle.name}
                          </h3>
                          {vehicle.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">{vehicle.description}</p>
                          )}
                        </div>

                        {/* Specs Strip */}
                        <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-2xl bg-gray-50 border border-gray-100 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 block">Fuel Type</span>
                            <span className="font-bold text-gray-800 text-[11px]">{vehicle.fuelType}</span>
                          </div>
                          <div className="border-x border-gray-200">
                            <span className="text-[10px] text-gray-400 block">Seating</span>
                            <span className="font-bold text-gray-800 text-[11px]">{vehicle.seatingCapacity} Seats</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block">AC Mode</span>
                            <span className="font-bold text-gray-800 text-[11px]">Climate Control</span>
                          </div>
                        </div>

                        {/* Tariff Banner */}
                        <div className="flex items-baseline justify-between pt-1">
                          <div>
                            <span className="text-[10px] text-gray-500 block uppercase font-medium">Tariff from:</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-bold font-serif text-emerald-800">{formatINR(dailyRate)}</span>
                              <span className="text-xs text-gray-500">/ 24 hrs</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-emerald-700 font-semibold block">✓ Insurance Included</span>
                            <span className="text-[10px] text-gray-400">Zero hidden fees</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenRental('with_driver', vehicle._id || vehicle.id)}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>With Driver</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenRental('without_driver', vehicle._id || vehicle.id)}
                        className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5 text-purple-600" />
                        <span>Self-Drive</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ================= HOW IT WORKS / COMPARISON ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-emerald-50 to-amber-50/40 rounded-3xl p-6 sm:p-10 border border-emerald-100 shadow-xs space-y-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Transparent Process</span>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-gray-900 mt-1">
                With Driver vs Self-Drive: Which is Right for You?
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* With Driver */}
              <div className="bg-white rounded-2xl p-6 border border-emerald-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-base">Option 1: With Mountain Driver (டிரைவர் உடன்)</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Best for families, honeymooners, and travellers unfamiliar with hair-pin bends and steep off-road trails.
                </p>
                <ul className="space-y-2 text-xs text-gray-700 pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Local hill pilot with 8+ years mountain terrain experience</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Driver allowance (Batta) fully covered in package</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Knows hidden viewpoints, tea estate trails & wildlife corridors</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Zero liability for tyre wear or hill driving stress</span>
                  </li>
                </ul>
              </div>

              {/* Self Drive */}
              <div className="bg-white rounded-2xl p-6 border border-purple-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-purple-900">
                  <Key className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-base">Option 2: Without Driver / Self-Drive (செல்ஃப் டிரைவ்)</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Best for driving enthusiasts, couples desiring total privacy, and experienced mountain drivers.
                </p>
                <ul className="space-y-2 text-xs text-gray-700 pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Valid Indian Driving License required (Age 21+)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>100% Refundable Security Deposit of ₹3,000 returned at handover</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Full-to-Full / Same-to-Same transparent fuel policy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Clean digital handover with pre-trip odometer & photo inspection</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ================= MODAL ================= */}
        <VehicleRentalModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialMode={selectedRentalMode}
          preSelectedVehicleId={preSelectedVehicleId}
        />
      </div>
    </>
  );
}

