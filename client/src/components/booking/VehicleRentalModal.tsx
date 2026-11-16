import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Key,
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Check,
  X,
  Loader2,
  IndianRupee,
  Sparkles,
  AlertCircle,
  FileText,
  ChevronRight,
  Gauge,
  Fuel,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createBooking } from '../../api/bookings';
import { useVehicleStore } from '../../store';
import { getAssets } from '../../api/assets';
import { formatINR } from '../../utils/formatters';
import { openWhatsAppSafely } from '../../utils/whatsapp';
import {
  IVehicleMaster,
  IBooking,
  ITransportVehicleSelection,
  IRentalAssetSelection,
} from '../../types';

export interface VehicleRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'with_driver' | 'without_driver';
  preSelectedVehicleId?: string | number;
  onSuccess?: (booking: IBooking, whatsappUrl?: string) => void;
}

export default function VehicleRentalModal({
  isOpen,
  onClose,
  initialMode = 'with_driver',
  preSelectedVehicleId,
  onSuccess,
}: VehicleRentalModalProps): React.ReactElement | null {
  const navigate = useNavigate();
  const { vehicles, loading: loadingVehicles, fetchVehicles } = useVehicleStore();

  // Mode: With Driver vs Without Driver (Self Drive)
  const [rentalMode, setRentalMode] = useState<'with_driver' | 'without_driver'>(initialMode);

  // Selected Vehicle
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Trip Dates & Duration
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfterStr = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState<string>(tomorrowStr);
  const [returnDate, setReturnDate] = useState<string>(dayAfterStr);
  const [rentalDays, setRentalDays] = useState<number>(1);

  // Pickup & Drop Location
  const [pickupLocation, setPickupLocation] = useState<string>('Munnar Town Center');
  const [dropLocation, setDropLocation] = useState<string>('Munnar Town Center');
  const [customDestination, setCustomDestination] = useState<string>('Munnar & Hill Corridors');

  // Customer & Driver Info
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [persons, setPersons] = useState<number>(4);
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Self Drive Specifics
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState<string>('');
  const [depositAcknowledged, setDepositAcknowledged] = useState<boolean>(true);

  // Optional Gear Add-ons
  const [availableGear, setAvailableGear] = useState<IRentalAssetSelection[]>([]);
  const [selectedGear, setSelectedGear] = useState<IRentalAssetSelection[]>([]);

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (vehicles.length === 0) fetchVehicles();
      getAssets({ status: 'available' })
        .then((res) => {
          if (res.success && res.assets) {
            setAvailableGear(
              res.assets
                .filter((a) => a.category !== 'vehicle')
                .map((a) => ({
                  asset: a._id || a.id,
                  name: a.name,
                  rentPrice: a.rentPrice || 400,
                  quantity: 1,
                }))
            );
          }
        })
        .catch(() => {});
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Set initial vehicle selection
  useEffect(() => {
    if (vehicles.length > 0) {
      if (preSelectedVehicleId) {
        const found = vehicles.find((v) => String(v._id || v.id) === String(preSelectedVehicleId));
        if (found) {
          setSelectedVehicleId(String(found._id || found.id));
          return;
        }
      }
      if (!selectedVehicleId) {
        setSelectedVehicleId(String(vehicles[0]._id || vehicles[0].id));
      }
    }
  }, [vehicles, preSelectedVehicleId]);

  // Update initialMode if prop changes
  useEffect(() => {
    if (initialMode) setRentalMode(initialMode);
  }, [initialMode]);

  // Automatically calculate rental days between pickup and return date
  useEffect(() => {
    if (pickupDate && returnDate) {
      const start = new Date(pickupDate).getTime();
      const end = new Date(returnDate).getTime();
      const diffMs = end - start;
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      setRentalDays(days);
    }
  }, [pickupDate, returnDate]);

  // Currently selected vehicle object
  const currentVehicle: IVehicleMaster | undefined = useMemo(() => {
    return vehicles.find((v) => String(v._id || v.id) === String(selectedVehicleId)) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // Filter vehicles by rental availability
  const availableFleet = useMemo(() => {
    return vehicles.filter((v) => v.isAvailableForRental !== false);
  }, [vehicles]);

  // Price Calculation
  const dailyRate = currentVehicle?.pricePerDay || 3200;
  // If With Driver, includes driver batta. If Without Driver, base tariff
  const baseVehicleRent = dailyRate * rentalDays;
  const gearTotal = selectedGear.reduce((sum, g) => sum + (Number(g.rentPrice) || 0) * (Number(g.quantity) || 1), 0);
  const totalAmount = baseVehicleRent + gearTotal;

  const toggleGear = (item: IRentalAssetSelection) => {
    setSelectedGear((prev) => {
      const exists = prev.find((g) => g.name === item.name);
      if (exists) return prev.filter((g) => g.name !== item.name);
      return [...prev, item];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Please enter customer full name');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (rentalMode === 'without_driver' && !drivingLicenseNumber.trim()) {
      toast.error('🪪 Valid Driving License number is required for Self-Drive');
      return;
    }

    if (!currentVehicle) {
      toast.error('Please select a vehicle from fleet');
      return;
    }

    setSubmitting(true);
    try {
      const transportVehicle: ITransportVehicleSelection = {
        name: currentVehicle.name,
        vehicleType: currentVehicle.vehicleType,
        price: dailyRate,
        seatingCapacity: currentVehicle.seatingCapacity,
        regNumber: currentVehicle.regNumber,
        badge: currentVehicle.badge,
        categoryLabel: currentVehicle.categoryLabel,
        description: currentVehicle.description,
      };

      const bookingType = rentalMode === 'without_driver' ? 'vehicle_rental_without_driver' : 'vehicle_rental_with_driver';

      const customFeatures = {
        foodIncluded: false,
        stayIncluded: false,
        rentalOption: rentalMode,
        rentalDays,
        pickupDate,
        returnDate,
        pickupLocation,
        dropLocation,
        destinationDetails: customDestination,
        drivingLicenseNumber: rentalMode === 'without_driver' ? drivingLicenseNumber.trim().toUpperCase() : undefined,
        securityDepositAcknowledged: rentalMode === 'without_driver' ? depositAcknowledged : undefined,
      };

      const payload = {
        bookingType,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        travelDate: pickupDate,
        persons: Number(persons) || 4,
        pickupLocation: `${pickupLocation} (Return: ${dropLocation})`,
        specialRequests: specialRequests.trim() || undefined,
        transportVehicle,
        rentalAssets: selectedGear,
        customFeatures,
      };

      const res = await createBooking(payload as any);

      if (res.success && res.booking) {
        toast.success(
          rentalMode === 'without_driver'
            ? '🎉 Self-Drive vehicle booking confirmed! Check WhatsApp for details.'
            : '🎉 Vehicle with Driver booked! Mountain pilot assigned.'
        );

        if (res.whatsappUrl) {
          openWhatsAppSafely(res.whatsappUrl);
        }

        if (onSuccess) {
          onSuccess(res.booking, res.whatsappUrl);
        }

        onClose();
        navigate('/booking-success', {
          state: {
            booking: res.booking,
            whatsappUrl: res.whatsappUrl,
          },
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit vehicle rental booking';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div
        className="fixed inset-0 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#142419] to-[#1E3626] text-white flex items-center justify-between border-b border-emerald-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-gray-900 flex items-center justify-center font-bold shadow-md">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                  Vehicle Rental Process (வாகனம் வாடகை)
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Pure Rental Only
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Book 4x4 Jeeps, SUVs & Cars with dedicated mountain driver or self-drive.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: CHOOSE RENTAL MODE (WITH DRIVER VS WITHOUT DRIVER) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
              Step 1: Choose Rental Type (டிரைவர் உடன் / செல்ஃப் டிரைவ்)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: With Driver */}
              <button
                type="button"
                onClick={() => setRentalMode('with_driver')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  rentalMode === 'with_driver'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-sm text-[#192D20]">
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                      <span>With Mountain Driver</span>
                    </span>
                    {rentalMode === 'with_driver' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    Relax and take in mountain scenery. Dedicated certified local pilot handles tough ghat roads & off-road safari trails.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
                  <span>Certified Pilot Included</span>
                  <span className="bg-emerald-100 px-2 py-0.5 rounded-full">Zero driving stress</span>
                </div>
              </button>

              {/* Option B: Without Driver (Self Drive) */}
              <button
                type="button"
                onClick={() => setRentalMode('without_driver')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  rentalMode === 'without_driver'
                    ? 'border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-sm text-[#192D20]">
                      <Key className="w-4 h-4 text-purple-700" />
                      <span>Without Driver (Self-Drive)</span>
                    </span>
                    {rentalMode === 'without_driver' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-600 fill-purple-100" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    Drive yourself. Total privacy and complete route freedom. Requires active Indian Driving License & refundable security deposit.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-purple-200/60 flex items-center justify-between text-[11px] font-semibold text-purple-800">
                  <span>DL Required • Age 21+</span>
                  <span className="bg-purple-100 px-2 py-0.5 rounded-full">₹3,000 Refundable Deposit</span>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: SELECT VEHICLE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                Step 2: Select Vehicle from Fleet (வாகனம் தேர்வு செய்க)
              </label>
              <span className="text-[11px] text-gray-500">{availableFleet.length} models ready</span>
            </div>

            {loadingVehicles ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                <span className="text-xs text-gray-500">Loading verified fleet...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableFleet.map((v) => {
                  const isSelected = String(v._id || v.id) === String(selectedVehicleId);
                  const photo = v.imageUrl || (v.images && v.images[0]) || '';

                  return (
                    <div
                      key={v._id || v.id}
                      onClick={() => setSelectedVehicleId(String(v._id || v.id))}
                      className={`rounded-2xl border-2 overflow-hidden transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/30 shadow-md ring-1 ring-emerald-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="relative aspect-[16/10] bg-gray-100">
                        {photo ? (
                          <img src={photo} alt={v.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Car className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 bg-amber-400 text-gray-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                          {v.regNumber}
                        </span>
                        {isSelected && (
                          <span className="absolute top-2 right-2 bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <Check className="w-3 h-3" /> Selected
                          </span>
                        )}
                      </div>

                      <div className="p-3 space-y-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-1">{v.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <span>💺 {v.seatingCapacity} Seats</span>
                          <span>•</span>
                          <span>{v.fuelType}</span>
                          <span>•</span>
                          <span className="capitalize">{v.vehicleType}</span>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">Daily Tariff:</span>
                          <span className="font-bold text-sm text-emerald-800">
                            {formatINR(v.pricePerDay || 3200)} <span className="text-[10px] font-normal text-gray-500">/day</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 3: TRIP DATES, DAYS & LOCATIONS */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
              Step 3: Rental Dates & Locations
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Pickup Date <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={tomorrowStr}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Return Date <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={pickupDate}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Total Rental Duration</label>
                <div className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-emerald-800 flex items-center justify-between">
                  <span>{rentalDays} Day{rentalDays > 1 ? 's' : ''}</span>
                  <span className="text-[10px] text-gray-500 font-normal">24h basis</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Pickup Point</label>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs"
                >
                  <option value="Munnar Town Center">Munnar Town Center</option>
                  <option value="Coimbatore Airport / Railway Station">Coimbatore Airport / Junction</option>
                  <option value="Cochin International Airport (COK)">Cochin International Airport (COK)</option>
                  <option value="Pollachi Junction">Pollachi Junction</option>
                  <option value="Kanthalloor / Marayoor">Kanthalloor / Marayoor</option>
                  <option value="Doorstep Hotel Delivery">Doorstep Hotel / Resort Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Return / Drop Point</label>
                <select
                  value={dropLocation}
                  onChange={(e) => setDropLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs"
                >
                  <option value="Munnar Town Center">Munnar Town Center</option>
                  <option value="Coimbatore Airport / Railway Station">Coimbatore Airport / Junction</option>
                  <option value="Cochin International Airport (COK)">Cochin International Airport (COK)</option>
                  <option value="Same as Pickup Location">Same as Pickup Location</option>
                </select>
              </div>
            </div>
          </div>

          {/* STEP 4: CUSTOMER DETAILS & SELF-DRIVE LICENSE */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
              Step 4: Customer Contact {rentalMode === 'without_driver' ? '& Driving License' : ''}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  WhatsApp Mobile Number <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* MANDATORY SELF-DRIVE VERIFICATION */}
            {rentalMode === 'without_driver' && (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold text-purple-900">
                    Self-Drive Verification (டிரைவிங் லைசென்ஸ் விபரம்)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Indian Driving License (DL) Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TN38 20180004523"
                      value={drivingLicenseNumber}
                      onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-white text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Security Deposit Terms</label>
                    <div className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs text-purple-900 flex items-center justify-between">
                      <span className="font-bold">₹3,000 Refundable Deposit</span>
                      <span className="text-[10px] text-purple-600">Refunded at handover</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="depositCheck"
                    checked={depositAcknowledged}
                    onChange={(e) => setDepositAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="depositCheck" className="text-[11px] text-gray-700">
                    I confirm that I am 21+ years old, hold a valid 4-wheeler Driving License, and agree to the fuel policy (Same-to-Same) & refundable security deposit.
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* STEP 5: OPTIONAL GEAR ADD-ONS */}
          {availableGear.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                Optional Gear Add-ons (கூடுதல் வாடகை உபகரணங்கள்)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableGear.slice(0, 6).map((item) => {
                  const isChecked = selectedGear.some((g) => g.name === item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggleGear(item)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold shadow-2xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <span className="block truncate">{item.name}</span>
                        <span className="text-[10px] text-gray-500">+{formatINR(item.rentPrice)}</span>
                      </div>
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                          isChecked ? 'bg-emerald-600 text-white' : 'border border-gray-300'
                        }`}
                      >
                        {isChecked && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: TRANSPARENT FARE SUMMARY & INSTANT BOOK BUTTON */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-900 via-[#192D20] to-[#122316] text-white space-y-3 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
                  Rental Fare Summary
                </span>
                <span className="text-sm font-bold text-white">
                  {currentVehicle?.name} ({currentVehicle?.regNumber})
                </span>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                {rentalMode === 'without_driver' ? '🔑 Self-Drive' : '🚖 With Mountain Driver'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-gray-200">
              <div className="flex justify-between">
                <span>
                  Base Tariff ({formatINR(dailyRate)} × {rentalDays} Day{rentalDays > 1 ? 's' : ''}):
                </span>
                <span className="font-semibold text-white">{formatINR(baseVehicleRent)}</span>
              </div>

              {gearTotal > 0 && (
                <div className="flex justify-between">
                  <span>Rental Gear Add-ons ({selectedGear.length} items):</span>
                  <span className="font-semibold text-emerald-300">+{formatINR(gearTotal)}</span>
                </div>
              )}

              {rentalMode === 'without_driver' && (
                <div className="flex justify-between text-amber-300 text-[11px]">
                  <span>Refundable Security Deposit:</span>
                  <span>₹3,000 (Refundable at return)</span>
                </div>
              )}

              {rentalMode === 'with_driver' && (
                <div className="flex justify-between text-emerald-300 text-[11px]">
                  <span>Mountain Pilot Driver Batta:</span>
                  <span>Included</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-sm sm:text-base font-bold text-white">
                <span>Total Payable Rental:</span>
                <span className="text-xl font-black text-amber-400">{formatINR(totalAmount)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-900 font-bold text-sm shadow-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming Booking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Book {rentalMode === 'without_driver' ? 'Self-Drive Vehicle' : 'Vehicle with Driver'} Now
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

