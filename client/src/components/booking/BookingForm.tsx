import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Phone,
  User,
  Mail,
  MapPin,
  Users,
  MessageSquare,
  Loader2,
  Sparkles,
  Car,
  Tent,
  Camera,
  Compass,
  Flame,
  Utensils,
  Home,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldCheck,
  Clock,
  Compass as CompassIcon,
  Plus,
  Minus,
} from 'lucide-react';
import { createBooking } from '../../api/bookings';
import { useVehicleStore } from '../../store';
import { getAssets } from '../../api/assets';
import { formatINR } from '../../utils/formatters';
import { openWhatsAppSafely } from '../../utils/whatsapp';
import TierBadge from '../common/TierBadge';
import CategoryChip from '../common/CategoryChip';
import {
  IPackage,
  IBooking,
  BookingType,
  ITransportVehicleSelection,
  IRentalAssetSelection,
  IVehicleMaster,
} from '../../types';

// Validation Schema
const bookingSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be under 60 characters'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  travelDate: z.string().min(1, 'Please select your intended travel date'),
  persons: z.coerce.number().min(1, 'At least 1 person required'),
  pickupLocation: z.string().min(2, 'Please enter your pickup city or station (e.g., Coimbatore, Kochi, Bangalore)'),
  specialRequests: z.string().max(400, 'Notes cannot exceed 400 characters').optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export interface BookingFormProps {
  selectedPackage: IPackage | null;
  onSuccess?: (booking: IBooking, whatsappUrl?: string) => void;
  onCancel?: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  selectedPackage,
  onSuccess,
  onCancel,
}) => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>('');
  const navigate = useNavigate();

  // Booking Mode: Tour Package Plan vs Vehicle Rental with Driver Only
  const [bookingMode, setBookingMode] = useState<BookingType>('tour_package');

  // Plan Feature Customizations (ethu venum / vena toggles)
  const [foodIncluded, setFoodIncluded] = useState<boolean>(true); // Food venum / vena
  const [stayIncluded, setStayIncluded] = useState<boolean>(true); // Stay venum / vena
  const [campfireIncluded, setCampfireIncluded] = useState<boolean>(false);
  const [photographyIncluded, setPhotographyIncluded] = useState<boolean>(false);

  // Vehicle Rental Specific State
  const [rentalDays, setRentalDays] = useState<number>(1);
  const [customDestination, setCustomDestination] = useState<string>(
    'Flexible / Open Route (Directed by Customer on Trip)'
  );

  // 100% Real Fleet Database Records (Managed centrally via Zustand Store)
  const { vehicles: dbVehicles, loading: loadingVehicles, fetchVehicles } = useVehicleStore();

  const [selectedRentalVehicle, setSelectedRentalVehicle] = useState<ITransportVehicleSelection>({
    name: 'Mahindra Commander 4x4 Safari Jeep (KL 68 C 3024)',
    vehicleType: 'jeep',
    price: 3200,
    seatingCapacity: 7,
    regNumber: 'KL 68 C 3024',
    badge: 'Signature Hills 4x4 (Max 7)',
    categoryLabel: '4x4 Safari Jeep (7 Seats)',
    description: 'Iconic mountain safari jeep with heavy-duty off-road suspension',
  });

  const [selectedTourVehicle, setSelectedTourVehicle] = useState<ITransportVehicleSelection>({
    name: 'Mahindra Commander 4x4 Safari Jeep (KL 68 C 3024)',
    vehicleType: 'jeep',
    price: 0,
    seatingCapacity: 7,
    regNumber: 'KL 68 C 3024',
    badge: 'Signature Hills 4x4 (Max 7)',
    categoryLabel: '4x4 Safari Jeep (7 Seats)',
    description: 'Iconic mountain safari jeep with heavy-duty off-road suspension',
  });

  // Fetch Fleet from MySQL via Zustand on mount if not yet fetched
  useEffect(() => {
    if (dbVehicles.length === 0) {
      fetchVehicles();
    }
  }, [dbVehicles.length, fetchVehicles]);

  // Auto-sync default vehicle once fleet is loaded from database
  useEffect(() => {
    if (dbVehicles && dbVehicles.length > 0) {
      const defaultRide = dbVehicles.find((v) => v.regNumber?.includes('KL 68 C 3024')) || dbVehicles[0];
      if (defaultRide && selectedRentalVehicle.regNumber === 'KL 68 C 3024') {
        setSelectedRentalVehicle({
          name: defaultRide.name,
          vehicleType: defaultRide.vehicleType,
          price: defaultRide.pricePerDay || 3200,
          seatingCapacity: defaultRide.seatingCapacity,
          regNumber: defaultRide.regNumber,
          badge: defaultRide.badge,
          categoryLabel: defaultRide.categoryLabel,
          description: defaultRide.description,
        });
        setSelectedTourVehicle({
          name: defaultRide.name,
          vehicleType: defaultRide.vehicleType,
          price: defaultRide.tourAddonPrice || 0,
          seatingCapacity: defaultRide.seatingCapacity,
          regNumber: defaultRide.regNumber,
          badge: defaultRide.badge,
          categoryLabel: defaultRide.categoryLabel,
          description: defaultRide.description,
        });
      }
    }
  }, [dbVehicles]);

  // Optional Rental Gear Add-ons State (Loaded 100% from Database)
  const [showGearAddons, setShowGearAddons] = useState<boolean>(false);
  const [selectedRentalAssets, setSelectedRentalAssets] = useState<IRentalAssetSelection[]>([]);
  const [availableGearAddons, setAvailableGearAddons] = useState<IRentalAssetSelection[]>([]);

  // Fetch real camping and adventure gear from database
  useEffect(() => {
    let isMounted = true;
    const loadGear = async () => {
      try {
        const res = await getAssets({ status: 'available' });
        if (isMounted && res && res.assets && res.assets.length > 0) {
          const nonVehicleGear = res.assets
            .filter((a) => a.category !== 'vehicle')
            .map((a) => ({
              asset: a._id || a.id,
              name: a.name,
              rentPrice: a.rentPrice || 400,
              quantity: 1,
            }));
          setAvailableGearAddons(nonVehicleGear);
        }
      } catch (err) {
        console.error('Failed to load gear from database:', err);
      }
    };
    loadGear();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleRentalGear = (gear: IRentalAssetSelection) => {
    setSelectedRentalAssets((prev) => {
      const exists = prev.find((item) => item.name === gear.name);
      if (exists) {
        return prev.filter((item) => item.name !== gear.name);
      } else {
        return [...prev, gear];
      }
    });
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      email: '',
      travelDate: selectedPackage?.availableDates?.[0]
        ? new Date(selectedPackage.availableDates[0]).toISOString().split('T')[0]
        : '',
      persons: 4,
      pickupLocation: 'Office / Vehicle Collection Point (Perur, Coimbatore)',
      specialRequests: '',
    },
  });

  const watchedPersons = Number(watch('persons')) || 1;
  const isCouple = selectedPackage?.category === 'couple';
  const seatsLeft = selectedPackage?.seatsLeft !== undefined ? selectedPackage.seatsLeft : 6;

  // Helper: Find the best matching vehicle from database for exact passenger count (members)
  const getBestVehicleForPax = (
    fleet: IVehicleMaster[],
    pax: number,
    mode: BookingType
  ): IVehicleMaster | null => {
    if (!fleet || fleet.length === 0) return null;

    if (mode === 'tour_package') {
      // Find vehicles that can hold `pax` (exclude self-drive unless pax > 26)
      const candidates = fleet.filter(
        (v) => v.isAvailableForTour && (v.seatingCapacity || 100) >= pax && v.vehicleType !== 'self'
      );

      if (candidates.length === 0) {
        return fleet.find((v) => v.isAvailableForTour) || fleet[0];
      }

      // Find the minimum capacity that can accommodate this group size
      const minCap = Math.min(...candidates.map((v) => v.seatingCapacity || 100));
      const tightest = candidates.filter((v) => (v.seatingCapacity || 100) === minCap);

      // Sort: Included (₹0) first, then lowest tourAddonPrice, then sortOrder
      tightest.sort((a, b) => {
        if ((a.tourAddonPrice || 0) !== (b.tourAddonPrice || 0)) {
          return (a.tourAddonPrice || 0) - (b.tourAddonPrice || 0);
        }
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });

      return tightest[0];
    } else {
      // Vehicle rental with driver
      const candidates = fleet.filter(
        (v) => v.isAvailableForRental && (v.seatingCapacity || 100) >= pax
      );

      if (candidates.length === 0) {
        return fleet.find((v) => v.isAvailableForRental) || fleet[0];
      }

      const minCap = Math.min(...candidates.map((v) => v.seatingCapacity || 100));
      const tightest = candidates.filter((v) => (v.seatingCapacity || 100) === minCap);

      tightest.sort((a, b) => {
        if ((a.pricePerDay || 0) !== (b.pricePerDay || 0)) {
          return (a.pricePerDay || 0) - (b.pricePerDay || 0);
        }
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });

      return tightest[0];
    }
  };

  // Filter vehicles dynamically based on traveller count (persons)
  const [showAllVehicles, setShowAllVehicles] = useState<boolean>(false);

  // Available Tour Vehicles directly from Database filtered by group size (persons)
  const availableTourVehicles = useMemo(() => {
    const tourFleet = [...dbVehicles.filter((v) => v.isAvailableForTour)];
    if (showAllVehicles) return tourFleet;
    const fitting = tourFleet.filter((v) => (v.seatingCapacity || 100) >= watchedPersons);
    // Sort so closest capacity and included price appear first
    fitting.sort((a, b) => {
      const capA = a.seatingCapacity || 100;
      const capB = b.seatingCapacity || 100;
      if (capA !== capB) return capA - capB;
      return (a.tourAddonPrice || 0) - (b.tourAddonPrice || 0);
    });
    return fitting.length > 0 ? fitting : tourFleet;
  }, [dbVehicles, watchedPersons, showAllVehicles]);

  // Available Rental Vehicles directly from Database filtered by group size (persons)
  const availableRentalVehicles = useMemo(() => {
    const rentalFleet = [...dbVehicles.filter((v) => v.isAvailableForRental)];
    if (showAllVehicles) return rentalFleet;
    const fitting = rentalFleet.filter((v) => (v.seatingCapacity || 100) >= watchedPersons);
    fitting.sort((a, b) => {
      const capA = a.seatingCapacity || 100;
      const capB = b.seatingCapacity || 100;
      if (capA !== capB) return capA - capB;
      return (a.pricePerDay || 0) - (b.pricePerDay || 0);
    });
    return fitting.length > 0 ? fitting : rentalFleet;
  }, [dbVehicles, watchedPersons, showAllVehicles]);

  // AUTOMATIC VEHICLE SELECTION: Whenever passenger count (members) changes,
  // automatically select the ideal matching vehicle from database!
  useEffect(() => {
    if (dbVehicles.length === 0) return;

    if (bookingMode === 'tour_package') {
      const best = getBestVehicleForPax(dbVehicles, watchedPersons, 'tour_package');
      if (best) {
        setSelectedTourVehicle({
          name: best.name,
          vehicleType: best.vehicleType,
          price: best.tourAddonPrice || 0,
          seatingCapacity: best.seatingCapacity,
          regNumber: best.regNumber,
          badge: best.badge,
          categoryLabel: best.categoryLabel,
          description: best.description,
        });
      }
    } else {
      const best = getBestVehicleForPax(dbVehicles, watchedPersons, 'vehicle_rental_with_driver');
      if (best) {
        setSelectedRentalVehicle({
          name: best.name,
          vehicleType: best.vehicleType,
          price: best.pricePerDay || 3200,
          seatingCapacity: best.seatingCapacity,
          regNumber: best.regNumber,
          badge: best.badge,
          categoryLabel: best.categoryLabel,
          description: best.description,
        });
      }
    }
  }, [watchedPersons, bookingMode, dbVehicles]);

  // Gear total
  const gearPrice = selectedRentalAssets.reduce(
    (sum, a) => sum + Number(a.rentPrice) * (Number(a.quantity) || 1),
    0
  );

  // Add-on extras
  const campfireExtra = campfireIncluded ? 800 : 0;
  const photographyExtra = photographyIncluded ? 1200 : 0;

  // Calculated Price depending on Mode & Feature Customizations
  let calculatedTotal = 0;
  let basePackagePrice = 0;
  let vehiclePrice = 0;

  if (bookingMode === 'tour_package') {
    let rawBase =
      selectedPackage?.priceUnit === 'per person'
        ? (selectedPackage?.price || 3500) * watchedPersons
        : (selectedPackage?.price || 8500) *
          Math.max(1, Math.ceil(watchedPersons / (selectedPackage?.maxSeats || 6)));

    // Customization adjustments (venum / vena)
    if (!foodIncluded) {
      rawBase = Math.max(1000, rawBase - 450 * watchedPersons);
    }
    if (!stayIncluded) {
      rawBase = Math.max(1000, rawBase - 1200 * watchedPersons);
    }

    basePackagePrice = rawBase;
    vehiclePrice = selectedTourVehicle.price || 0;
    calculatedTotal = basePackagePrice + vehiclePrice + gearPrice + campfireExtra + photographyExtra;
  } else {
    // Vehicle Rental Only with Driver
    const dailyRate = selectedRentalVehicle.price || 3200;
    let rentalBase = dailyRate * rentalDays;

    if (foodIncluded) {
      rentalBase += 450 * watchedPersons * rentalDays;
    }

    basePackagePrice = rentalBase;
    vehiclePrice = dailyRate;
    calculatedTotal = rentalBase + gearPrice + campfireExtra + photographyExtra;
  }

  // Minimum date today
  const minDateString = new Date().toISOString().split('T')[0];

  const onSubmit = async (data: BookingFormData) => {
    setSubmitting(true);
    setServerError('');

    try {
      const activeVehicle =
        bookingMode === 'vehicle_rental_with_driver' ? selectedRentalVehicle : selectedTourVehicle;

      const payload: any = {
        packageId: selectedPackage?._id || selectedPackage?.id || '',
        bookingType: bookingMode,
        customerName: data.customerName,
        phone: data.phone,
        email: data.email || undefined,
        travelDate: data.travelDate,
        persons: Number(data.persons),
        pickupLocation: data.pickupLocation,
        specialRequests: data.specialRequests,
        transportVehicle: activeVehicle,
        rentalAssets: selectedRentalAssets,
        customFeatures: {
          foodIncluded,
          stayIncluded: bookingMode === 'vehicle_rental_with_driver' ? false : stayIncluded,
          campfireIncluded,
          photographyIncluded,
          rentalDays: bookingMode === 'vehicle_rental_with_driver' ? rentalDays : (selectedPackage?.duration?.days || 2),
          openDestination: bookingMode === 'vehicle_rental_with_driver',
          destinationDetails:
            bookingMode === 'vehicle_rental_with_driver'
              ? customDestination
              : selectedPackage?.destination || 'Munnar',
        },
      };

      const result = await createBooking(payload);

      if (result.success) {
        if (result.whatsappUrl) {
          openWhatsAppSafely(result.whatsappUrl);
        }

        if (onSuccess) {
          onSuccess(result.booking, result.whatsappUrl);
        } else {
          navigate('/booking-success', {
            state: {
              booking: result.booking,
              whatsappUrl: result.whatsappUrl,
              whatsappMessage: result.whatsappMessage,
            },
          });
        }
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Unable to process your booking. Please check details or message us on WhatsApp.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 1. TOP BOOKING MODE SWITCHER */}
      <div className="p-1 bg-gray-100 rounded-2xl grid grid-cols-2 gap-1 border border-gray-200/80">
        <button
          type="button"
          onClick={() => setBookingMode('tour_package')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            bookingMode === 'tour_package'
              ? 'bg-white text-text shadow-xs ring-1 ring-black/5'
              : 'text-muted hover:text-text'
          }`}
        >
          <CompassIcon className="w-3.5 h-3.5 text-primary" />
          <span>Tour Package Plan</span>
        </button>

        <button
          type="button"
          onClick={() => setBookingMode('vehicle_rental_with_driver')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            bookingMode === 'vehicle_rental_with_driver'
              ? 'bg-white text-text shadow-xs ring-1 ring-black/5'
              : 'text-muted hover:text-text'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-emerald-600" />
          <span>Vehicle Rent + Driver</span>
        </button>
      </div>

      {/* Package Header (for Tour Package mode) */}
      {bookingMode === 'tour_package' && selectedPackage && (
        <div className="p-3.5 rounded-2xl bg-surface border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <CategoryChip category={selectedPackage.category} />
              <TierBadge tier={selectedPackage.tier} />
            </div>
            <h4 className="font-serif font-bold text-text text-sm">
              {selectedPackage.title}
            </h4>
            <p className="text-[11px] text-muted">
              {selectedPackage.destination} • {selectedPackage.duration?.days || 3} Days /{' '}
              {selectedPackage.duration?.nights || 2} Nights
            </p>
          </div>
          <div className="text-right sm:text-right border-t sm:border-t-0 pt-1.5 sm:pt-0">
            <span className="text-[10px] text-muted block">Base Package:</span>
            <span className="text-base font-bold text-primary-dark">
              {formatINR(selectedPackage.price)}
            </span>
            <span className="text-[10px] text-muted block">
              {selectedPackage.priceUnit || (isCouple ? 'per couple' : 'per person')}
            </span>
          </div>
        </div>
      )}

      {/* Banner for Vehicle Rental Only Mode */}
      {bookingMode === 'vehicle_rental_with_driver' && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-xs">
                  Car / 4x4 Jeep Rental with Driver Only
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Open route & flexible travel without fixed package or fixed location.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
              Driver Included
            </span>
          </div>

          {/* Rental Duration Days Selector */}
          <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-emerald-200/60">
            <span className="text-xs font-semibold text-emerald-950">Rental Duration:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setRentalDays(d)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    rentalDays === d
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {serverError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {serverError}
        </div>
      )}

      {/* 2. CUSTOMIZE PLAN FEATURES (VENUM / VENA OPTIONS) */}
      <div className="p-3.5 rounded-2xl bg-surface border border-gray-200/90 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-text uppercase tracking-wider">
              Customize Features (Venum / Vena)
            </span>
          </div>
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
            Toggles
          </span>
        </div>

        <p className="text-[11px] text-muted">
          Adjust what you want in your plan — food, stay, or vehicle only:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Food Option (Food Venum vs Food Vena) */}
          <div
            onClick={() => setFoodIncluded(!foodIncluded)}
            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
              foodIncluded
                ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-500/30'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Utensils
                className={`w-4 h-4 shrink-0 ${foodIncluded ? 'text-emerald-600' : 'text-gray-400'}`}
              />
              <div className="min-w-0">
                <span className="block font-bold text-xs truncate">
                  {foodIncluded ? '🍽️ Food: Included (Venum)' : '🍽️ Food: Vena (Self-Dining)'}
                </span>
                <span className="text-[10px] block opacity-80">
                  {foodIncluded ? 'Hill Meals (BF, Lunch, Dinner)' : 'Not included in cost'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  foodIncluded
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {foodIncluded ? '+₹450/p' : 'Vena'}
              </span>
            </div>
          </div>

          {/* Stay Option (Tour Package only) */}
          {bookingMode === 'tour_package' ? (
            <div
              onClick={() => setStayIncluded(!stayIncluded)}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                stayIncluded
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-500/30'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Home
                  className={`w-4 h-4 shrink-0 ${stayIncluded ? 'text-emerald-600' : 'text-gray-400'}`}
                />
                <div className="min-w-0">
                  <span className="block font-bold text-xs truncate">
                    {stayIncluded ? '🏡 Stay: Included (Venum)' : '🏡 Stay: Vena (Vehicle Only)'}
                  </span>
                  <span className="text-[10px] block opacity-80">
                    {stayIncluded ? 'Resort / Tent Stay Included' : 'Arrange your own room'}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    stayIncluded
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {stayIncluded ? 'Included' : '-₹1,200/p'}
                </span>
              </div>
            </div>
          ) : (
            /* Vehicle Only Stay Indicator */
            <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/80 text-xs flex items-center justify-between gap-2 text-gray-600">
              <div className="flex items-center gap-2 min-w-0">
                <Car className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="block font-bold text-xs">Stay: Vehicle Only Rental</span>
                  <span className="text-[10px] block text-muted">You stay wherever you wish</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-200 text-gray-700">
                Vehicle Only
              </span>
            </div>
          )}

          {/* Campfire & BBQ */}
          <div
            onClick={() => setCampfireIncluded(!campfireIncluded)}
            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
              campfireIncluded
                ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-medium ring-1 ring-amber-500/30'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Flame
                className={`w-4 h-4 shrink-0 ${campfireIncluded ? 'text-amber-600' : 'text-gray-400'}`}
              />
              <div className="min-w-0">
                <span className="block font-bold text-xs truncate">🔥 Night Campfire & BBQ</span>
                <span className="text-[10px] block opacity-80">
                  {campfireIncluded ? 'Bonfire wood + BBQ setup' : 'Optional add-on'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  campfireIncluded
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {campfireIncluded ? '+₹800' : '+₹800'}
              </span>
            </div>
          </div>

          {/* GoPro 5K Camera */}
          <div
            onClick={() => setPhotographyIncluded(!photographyIncluded)}
            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
              photographyIncluded
                ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 font-medium ring-1 ring-indigo-500/30'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Camera
                className={`w-4 h-4 shrink-0 ${photographyIncluded ? 'text-indigo-600' : 'text-gray-400'}`}
              />
              <div className="min-w-0">
                <span className="block font-bold text-xs truncate">📸 GoPro 5K Action Cam</span>
                <span className="text-[10px] block opacity-80">
                  {photographyIncluded ? 'HERO 11 5K Kit included' : 'Optional add-on'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  photographyIncluded
                    ? 'bg-indigo-200 text-indigo-900'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {photographyIncluded ? '+₹1,200' : '+₹1,200'}
              </span>
            </div>
          </div>
        </div>

        {/* Chauffeur Assurance */}
        <div className="p-2 rounded-xl bg-primary-light/40 border border-primary/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-primary-dark font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Dedicated Mountain Driver & Fuel Assistance</span>
          </div>
          <span className="font-bold text-primary text-[10px]">Included</span>
        </div>
      </div>

      {/* 3. CHOOSE VEHICLE BASED ON TRAVELLERS */}
      <div className="p-3.5 rounded-2xl bg-surface border border-gray-200/90 space-y-3">
        {/* Dynamic Travellers / Group Size Box directly above Vehicles */}
        <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-text">Group Size:</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                {watchedPersons} {watchedPersons === 1 ? 'Person' : 'Persons'}
              </span>
            </div>

            {/* Stepper +/- */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5 bg-gray-50">
              <button
                type="button"
                onClick={() => setValue('persons', Math.max(1, watchedPersons - 1))}
                disabled={watchedPersons <= 1 || (bookingMode === 'tour_package' && isCouple)}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Decrease persons"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-7 text-center text-xs font-bold text-gray-800">
                {watchedPersons}
              </span>
              <button
                type="button"
                onClick={() => setValue('persons', Math.min(26, watchedPersons + 1))}
                disabled={watchedPersons >= 26 || (bookingMode === 'tour_package' && isCouple)}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Increase persons"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[
              { label: '2 Couple/Duo', pax: 2 },
              { label: '4 Small Group', pax: 4 },
              { label: '6-7 Family', pax: 6 },
              { label: '10-12 Group', pax: 12 },
              { label: '15+ Big Fleet', pax: 17 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={bookingMode === 'tour_package' && isCouple}
                onClick={() => setValue('persons', preset.pax)}
                className={`text-[10px] px-2.5 py-1 rounded-md font-medium transition-all ${
                  watchedPersons === preset.pax
                    ? 'bg-primary text-white shadow-2xs font-bold'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Active Auto-Selection Banner */}
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
              <span className="text-[11px] text-primary-dark truncate">
                Auto-Selected for <strong>{watchedPersons} {watchedPersons === 1 ? 'Person' : 'Persons'}</strong>: <strong className="font-bold underline">{bookingMode === 'vehicle_rental_with_driver' ? selectedRentalVehicle.name : selectedTourVehicle.name}</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white shrink-0 shadow-2xs">
              ✓ Selected
            </span>
          </div>
        </div>

        {/* Vehicle Selection Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Car className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-text uppercase tracking-wider">
              {bookingMode === 'vehicle_rental_with_driver'
                ? `Available Vehicles (${watchedPersons} Pax)`
                : `Choose Ride (${watchedPersons} Pax)`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAllVehicles(!showAllVehicles)}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            {showAllVehicles ? 'Filter by Group Size' : 'Show All Fleet'}
          </button>
        </div>

        {/* Vehicle Options Grid from Real Database */}
        {loadingVehicles ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted font-medium">Fetching real vehicle fleet from database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(bookingMode === 'vehicle_rental_with_driver' ? availableRentalVehicles : availableTourVehicles).map(
              (v) => {
                const isSelected =
                  bookingMode === 'vehicle_rental_with_driver'
                    ? selectedRentalVehicle.name === v.name
                    : selectedTourVehicle.name === v.name;
                const fitsGroup = (v.seatingCapacity || 100) >= watchedPersons;
                const isBestFit = fitsGroup && (v.seatingCapacity || 100) - watchedPersons <= 3;
                const activePrice =
                  bookingMode === 'vehicle_rental_with_driver'
                    ? (v.pricePerDay || 0)
                    : (v.tourAddonPrice || 0);

                return (
                  <div
                    key={v.regNumber || v.name}
                    onClick={() => {
                      if (bookingMode === 'vehicle_rental_with_driver') {
                        setSelectedRentalVehicle({
                          name: v.name,
                          vehicleType: v.vehicleType,
                          price: v.pricePerDay || 0,
                          seatingCapacity: v.seatingCapacity,
                          regNumber: v.regNumber,
                          badge: v.badge,
                          categoryLabel: v.categoryLabel,
                          description: v.description,
                        });
                      } else {
                        setSelectedTourVehicle({
                          name: v.name,
                          vehicleType: v.vehicleType,
                          price: v.tourAddonPrice || 0,
                          seatingCapacity: v.seatingCapacity,
                          regNumber: v.regNumber,
                          badge: v.badge,
                          categoryLabel: v.categoryLabel,
                          description: v.description,
                        });
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'border-primary bg-primary-light/40 text-primary-dark font-semibold shadow-xs ring-1 ring-primary'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Car className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate font-bold text-xs">{v.name}</span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              💺 {v.seatingCapacity === 100 ? 'Flexible' : `Max ${v.seatingCapacity} Seats`}
                            </span>
                            {v.regNumber && !v.regNumber.includes('OWN-VEHICLE') && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                {v.regNumber}
                              </span>
                            )}
                            {isSelected ? (
                              <span className="text-[9px] font-bold text-white bg-primary px-1.5 py-0.2 rounded shadow-2xs">
                                ✓ Selected Ride
                              </span>
                            ) : isBestFit ? (
                              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                ✓ Best Fit for {watchedPersons} Pax
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-bold block ${
                            isSelected ? 'text-primary-dark' : 'text-gray-800'
                          }`}
                        >
                          {bookingMode === 'vehicle_rental_with_driver'
                            ? `${formatINR(activePrice)}/d`
                            : activePrice === 0
                            ? 'Included'
                            : `+${formatINR(activePrice)}`}
                        </span>
                      </div>
                    </div>

                    {v.description && (
                      <p className="text-[10px] text-muted line-clamp-1 pl-9">
                        {v.description}
                      </p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* 4. TRIP DESTINATION (for open route vehicle rentals) */}
      {bookingMode === 'vehicle_rental_with_driver' && (
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-text">
            Destination / Travel Route <span className="text-muted font-normal">(Flexible / Open)</span>
          </label>
          <input
            type="text"
            value={customDestination}
            onChange={(e) => setCustomDestination(e.target.value)}
            placeholder="e.g. Open Route / Customer Choice, Ooty, Valparai, Kodaikanal"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              'Flexible / Open Route (Tell Driver on Trip)',
              'Ooty & Nilgiris Hills',
              'Valparai & Sholayar Dam',
              'Kodaikanal Hill Station',
            ].map((route) => (
              <button
                key={route}
                type="button"
                onClick={() => setCustomDestination(route)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
                  customDestination === route
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface border-gray-200 text-text hover:bg-gray-100'
                }`}
              >
                {route}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. BASIC CUSTOMER DETAILS */}
      <div className="space-y-3.5 pt-1">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1" htmlFor="customerName">
            Full Name <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="customerName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Rahul Sharma"
              {...register('customerName')}
              className={`w-full pl-10 pr-4 py-2 rounded-xl border bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] ${
                errors.customerName ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-200'
              }`}
            />
          </div>
          {errors.customerName && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.customerName.message}</p>
          )}
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text mb-1" htmlFor="phone">
              WhatsApp Phone <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                {...register('phone')}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] ${
                  errors.phone ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1" htmlFor="email">
              Email Address <span className="text-muted font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] ${
                  errors.email ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Travel Date & Persons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text mb-1" htmlFor="travelDate">
              Travel Date <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="travelDate"
                type="date"
                min={minDateString}
                {...register('travelDate')}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] ${
                  errors.travelDate ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.travelDate && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.travelDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1" htmlFor="persons">
              Travellers ({bookingMode === 'vehicle_rental_with_driver' ? '1 to 26+ Guests' : isCouple ? 'Couple: 2 Persons Fixed' : `Seats Left: ${seatsLeft}`})
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="persons"
                type="number"
                min={1}
                max={bookingMode === 'tour_package' && isCouple ? 2 : 26}
                disabled={bookingMode === 'tour_package' && isCouple}
                {...register('persons')}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] ${
                  bookingMode === 'tour_package' && isCouple ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                } ${errors.persons ? 'border-rose-400' : 'border-gray-200'}`}
              />
            </div>
            {errors.persons && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.persons.message}</p>
            )}
          </div>
        </div>

        {/* Pickup Location */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-text" htmlFor="pickupLocation">
              Pickup Point / Station <span className="text-rose-600">*</span>
            </label>
            <a
              href="https://maps.app.goo.gl/NMojzWSiK3qqvGoJA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              <span>Office Collection Point ↗</span>
            </a>
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="pickupLocation"
              type="text"
              placeholder="e.g. Office Depot Perur, Coimbatore Junction, Airport, Hotel"
              {...register('pickupLocation')}
              className={`w-full pl-10 pr-4 py-2 rounded-xl border bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] ${
                errors.pickupLocation ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-200'
              }`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={() =>
                setValue('pickupLocation', 'Office / Vehicle Depot (Perur, Coimbatore)', {
                  shouldValidate: true,
                })
              }
              className="text-[10px] px-2.5 py-1 rounded-lg bg-surface border border-gray-200 text-text hover:bg-gray-100 transition-colors"
            >
              📍 Office Depot (Perur)
            </button>
            <button
              type="button"
              onClick={() =>
                setValue('pickupLocation', 'Coimbatore Railway Junction / Airport', {
                  shouldValidate: true,
                })
              }
              className="text-[10px] px-2.5 py-1 rounded-lg bg-surface border border-gray-200 text-text hover:bg-gray-100 transition-colors"
            >
              ✈️ Coimbatore Airport / Station
            </button>
          </div>
          {errors.pickupLocation && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.pickupLocation.message}</p>
          )}
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1" htmlFor="specialRequests">
            Special Requests / Dietary / Route Preferences <span className="text-muted font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-muted absolute left-3.5 top-3" />
            <textarea
              id="specialRequests"
              rows={2}
              placeholder="e.g. Vegetarian/Halal food pack, flexible morning start, baby seat..."
              {...register('specialRequests')}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          {errors.specialRequests && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.specialRequests.message}</p>
          )}
        </div>

        {/* Optional Rental Gear Expandable */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGearAddons(!showGearAddons)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Tent className="w-4 h-4 text-amber-600" />
              <div>
                <span className="text-xs font-bold text-text block">
                  Add Rental Camping Gear (Optional)
                </span>
                <span className="text-[10px] text-muted block">
                  {selectedRentalAssets.length > 0
                    ? `${selectedRentalAssets.length} item(s) selected (+${formatINR(gearPrice)})`
                    : 'Waterproof dome tents, trekking poles, BBQ kits'}
                </span>
              </div>
            </div>
            {showGearAddons ? (
              <ChevronUp className="w-4 h-4 text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted" />
            )}
          </button>

          {showGearAddons && (
            <div className="p-3 pt-0 space-y-2 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {availableGearAddons.map((gear) => {
                  const isChecked = selectedRentalAssets.some((a) => a.name === gear.name);
                  return (
                    <label
                      key={gear.name}
                      onClick={() => toggleRentalGear(gear)}
                      className={`flex items-start gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold'
                          : 'border-gray-200 bg-surface hover:bg-white text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-primary focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block truncate font-semibold text-xs">{gear.name}</span>
                        <span className="text-[10px] text-muted block">
                          Rent: +{formatINR(gear.rentPrice)}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. CALCULATED ESTIMATED TOTAL & BREAKDOWN */}
      <div className="p-4 rounded-2xl bg-primary-light/50 border border-primary/20 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted block font-medium">Estimated Total Price:</span>
            <span className="text-xl sm:text-2xl font-bold text-primary-dark">
              {formatINR(calculatedTotal)}
            </span>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] text-primary-dark font-medium bg-white px-2.5 py-1 rounded-lg border border-primary/20">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Confirm on WhatsApp</span>
            </span>
          </div>
        </div>

        {/* Clear transparent breakdown */}
        <div className="flex flex-wrap gap-2 text-[11px] text-muted pt-1 border-t border-primary/20">
          <span>
            {bookingMode === 'vehicle_rental_with_driver'
              ? `Cab (${rentalDays}d): ${formatINR(selectedRentalVehicle.price * rentalDays)}`
              : `Base Tour: ${formatINR(basePackagePrice)}`}
          </span>
          <span>• Food: {foodIncluded ? 'Included' : 'Excluded (Vena)'}</span>
          {bookingMode === 'tour_package' && (
            <span>• Stay: {stayIncluded ? 'Included' : 'Excluded'}</span>
          )}
          {campfireExtra > 0 && <span>• BBQ: +{formatINR(campfireExtra)}</span>}
          {photographyExtra > 0 && <span>• GoPro: +{formatINR(photographyExtra)}</span>}
          {gearPrice > 0 && <span>• Gear: +{formatINR(gearPrice)}</span>}
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 min-h-[46px] px-4 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex-1 min-h-[46px] px-6 rounded-xl bg-gradient-elaichi text-white text-xs sm:text-sm font-semibold shadow-elaichi hover:shadow-elaichi-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirming Booking...</span>
            </>
          ) : (
            <>
              <span>Book Now & Open WhatsApp</span>
            </>
          )}
        </button>
      </div>

      <p className="text-center text-[10px] text-muted">
        Directly saves your customized itinerary and opens WhatsApp with your chosen options.
      </p>
    </form>
  );
};

export default BookingForm;
