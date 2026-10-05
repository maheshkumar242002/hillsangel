import React, { useState, useEffect } from 'react';
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
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { createBooking } from '../../api/bookings';
import { formatINR } from '../../utils/formatters';
import { openWhatsAppSafely } from '../../utils/whatsapp';
import TierBadge from '../common/TierBadge';
import CategoryChip from '../common/CategoryChip';
import { IPackage, IBooking, ITransportVehicleSelection, IRentalAssetSelection } from '../../types';

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

  const isCouple = selectedPackage?.category === 'couple';
  const seatsLeft = selectedPackage?.seatsLeft !== undefined ? selectedPackage.seatsLeft : 14;

  // Transport Vehicle Selection State
  const [selectedVehicle, setSelectedVehicle] = useState<ITransportVehicleSelection>({
    name: 'Standard AC Sedan (Swift Dzire / Etios)',
    vehicleType: 'sedan',
    price: 0,
  });

  // Optional Rental Gear Add-ons State
  const [showGearAddons, setShowGearAddons] = useState<boolean>(false);
  const [selectedRentalAssets, setSelectedRentalAssets] = useState<IRentalAssetSelection[]>([]);

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
      persons: isCouple ? 2 : 1,
      pickupLocation: '',
      specialRequests: '',
    },
  });

  // Keep couple package persons fixed at 2
  useEffect(() => {
    if (isCouple) {
      setValue('persons', 2);
    }
  }, [isCouple, setValue]);

  const watchedPersons = watch('persons') || (isCouple ? 2 : 1);

  // Live estimated total price calculation
  const basePackagePrice = isCouple
    ? (selectedPackage?.price || 0) * Math.ceil(watchedPersons / 2)
    : (selectedPackage?.price || 0) * watchedPersons;

  const vehiclePrice = selectedVehicle.price || 0;
  const gearPrice = selectedRentalAssets.reduce(
    (sum, a) => sum + Number(a.rentPrice) * (Number(a.quantity) || 1),
    0
  );
  const calculatedTotal = basePackagePrice + vehiclePrice + gearPrice;

  // Minimum date today
  const minDateString = new Date().toISOString().split('T')[0];

  // Available vehicle presets (or dynamically from package)
  const vehicleOptions: ITransportVehicleSelection[] = [
    {
      name: 'Standard AC Sedan (Swift Dzire / Etios)',
      vehicleType: 'sedan',
      price: 0,
    },
    {
      name: 'Toyota Innova Crysta (Luxury 7-Seater SUV)',
      vehicleType: 'suv',
      price: 3500,
    },
    {
      name: 'Mahindra Thar 4x4 (Mountain Trail Jeep)',
      vehicleType: 'jeep',
      price: 4500,
    },
    {
      name: 'Force Luxury Tempo (14-Seater Group Van)',
      vehicleType: 'tempo',
      price: isCouple ? 6500 : 0,
    },
    {
      name: 'Royal Enfield Himalayan (Adventure Bike)',
      vehicleType: 'bike',
      price: 2000,
    },
    {
      name: 'Self-Drive / Own Vehicle (Meet at Resort)',
      vehicleType: 'self',
      price: 0,
    },
  ];

  // Optional gear rental add-on presets
  const availableGearAddons: IRentalAssetSelection[] = [
    {
      name: '4-Person Alpine Waterproof Dome Tent',
      rentPrice: 1200,
      quantity: 1,
    },
    {
      name: 'GoPro HERO 11 Black 5K Adventure Kit',
      rentPrice: 1200,
      quantity: 1,
    },
    {
      name: 'Carbon Fiber Trekking Pole Pair',
      rentPrice: 400,
      quantity: 1,
    },
    {
      name: 'Portable Charcoal BBQ & Bonfire Grill Kit',
      rentPrice: 800,
      quantity: 1,
    },
  ];

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

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedPackage) return;
    setSubmitting(true);
    setServerError('');

    try {
      const payload: any = {
        packageId: selectedPackage._id || selectedPackage.id || '',
        customerName: data.customerName,
        phone: data.phone,
        email: data.email || undefined,
        travelDate: data.travelDate,
        persons: Number(data.persons),
        pickupLocation: data.pickupLocation,
        specialRequests: data.specialRequests,
        transportVehicle: selectedVehicle,
        rentalAssets: selectedRentalAssets,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Selected Package Banner */}
      {selectedPackage && (
        <div className="p-4 rounded-2xl bg-surface border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CategoryChip category={selectedPackage.category} />
              <TierBadge tier={selectedPackage.tier} />
            </div>
            <h4 className="font-serif font-bold text-text text-base">
              {selectedPackage.title}
            </h4>
            <p className="text-xs text-muted">
              {selectedPackage.destination} • {selectedPackage.duration?.days || 3} Days /{' '}
              {selectedPackage.duration?.nights || 2} Nights
            </p>
          </div>
          <div className="text-right sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
            <span className="text-xs text-muted block">Base Rate:</span>
            <span className="text-lg font-bold text-primary-dark">
              {formatINR(selectedPackage.price)}
            </span>
            <span className="text-[11px] text-muted block">
              {selectedPackage.priceUnit || (isCouple ? 'per couple' : 'per person')}
            </span>
          </div>
        </div>
      )}

      {serverError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {serverError}
        </div>
      )}

      {/* Form Fields: Single Column on Mobile */}
      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="customerName">
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
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[46px] ${
                errors.customerName ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-200'
              }`}
            />
          </div>
          {errors.customerName && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.customerName.message}</p>
          )}
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="phone">
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
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[46px] ${
                  errors.phone ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="email">
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
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[46px] ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="travelDate">
              Travel Date <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="travelDate"
                type="date"
                min={minDateString}
                {...register('travelDate')}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[46px] ${
                  errors.travelDate ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.travelDate && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.travelDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="persons">
              Travellers ({isCouple ? 'Couple: 2 Persons Fixed' : `Seats Left: ${seatsLeft}`})
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="persons"
                type="number"
                min={isCouple ? 2 : 1}
                max={isCouple ? 2 : Math.min(seatsLeft, 16)}
                disabled={isCouple}
                {...register('persons')}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[46px] ${
                  isCouple ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
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
          <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="pickupLocation">
            Pickup City / Location <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="pickupLocation"
              type="text"
              placeholder="e.g. Coimbatore Airport, Kochi Station, Bangalore"
              {...register('pickupLocation')}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[46px] ${
                errors.pickupLocation ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-200'
              }`}
            />
          </div>
          {errors.pickupLocation && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.pickupLocation.message}</p>
          )}
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="specialRequests">
            Special Requests / Dietary / Room Preferences{' '}
            <span className="text-muted font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
            <textarea
              id="specialRequests"
              rows={2}
              placeholder="e.g. Anniversary candlelight setup, Jain/Halal food preference..."
              {...register('specialRequests')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          {errors.specialRequests && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.specialRequests.message}</p>
          )}
        </div>
        {/* CUSTOMER TRANSPORT VEHICLE SELECTION */}
        <div className="p-4 rounded-2xl bg-surface border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-text uppercase tracking-wider">
                Choose Transport Vehicle
              </span>
            </div>
            <span className="text-[11px] font-semibold text-primary">
              {selectedVehicle.price === 0 ? 'Included' : `+${formatINR(selectedVehicle.price)}`}
            </span>
          </div>
          <p className="text-[11px] text-muted">
            Select your preferred mountain transfer ride for pickup, sightseeing, and drop-off.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vehicleOptions.map((v) => {
              const isSelected = selectedVehicle.name === v.name;
              return (
                <div
                  key={v.name}
                  onClick={() => setSelectedVehicle(v)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-primary bg-primary-light/40 text-primary-dark font-semibold shadow-xs ring-1 ring-primary'
                      : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Car className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate font-bold text-xs">{v.name}</span>
                      <span className="text-[10px] text-muted block capitalize">{v.vehicleType}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold block ${
                        isSelected ? 'text-primary-dark' : 'text-gray-800'
                      }`}
                    >
                      {v.price === 0 ? 'Included' : `+${formatINR(v.price)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* OPTIONAL RENTAL GEAR ADD-ONS */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGearAddons(!showGearAddons)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Tent className="w-4 h-4 text-amber-600" />
              <div>
                <span className="text-xs font-bold text-text block">
                  Add Rental Gear & Equipment (Optional)
                </span>
                <span className="text-[11px] text-muted block">
                  {selectedRentalAssets.length > 0
                    ? `${selectedRentalAssets.length} add-on(s) selected (+${formatINR(gearPrice)})`
                    : 'Tents, GoPro 5K camera, trekking poles, and BBQ kit'}
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
            <div className="p-3.5 pt-0 space-y-2 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {availableGearAddons.map((gear) => {
                  const isChecked = selectedRentalAssets.some((a) => a.name === gear.name);
                  return (
                    <label
                      key={gear.name}
                      onClick={() => toggleRentalGear(gear)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
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

      {/* Calculated Total Price Bar with Breakdown */}
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
              <span>Pay directly on confirmation</span>
            </span>
          </div>
        </div>

        {/* Breakdown subtitle if vehicle or gear chosen */}
        {(vehiclePrice > 0 || gearPrice > 0) && (
          <div className="flex flex-wrap gap-2 text-[11px] text-muted pt-1 border-t border-primary/20">
            <span>Base: {formatINR(basePackagePrice)}</span>
            {vehiclePrice > 0 && <span>• Cab: +{formatINR(vehiclePrice)}</span>}
            {gearPrice > 0 && <span>• Gear: +{formatINR(gearPrice)}</span>}
          </div>
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 min-h-[48px] px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex-1 min-h-[48px] px-6 rounded-xl bg-gradient-elaichi text-white text-sm font-semibold shadow-elaichi hover:shadow-elaichi-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
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

      <p className="text-center text-[11px] text-muted">
        Submitting saves your booking and opens WhatsApp to coordinate your trip directly with our hill-station experts.
      </p>
    </form>
  );
};

export default BookingForm;
