import { BaseService } from './BaseService.js';
import bookingRepository from '../repository/bookingRepository.js';
import { generateBookingId } from '../utils/generateBookingId.js';
import {
  formatBookingWhatsAppMessage,
  formatCustomerConfirmationMessage,
  generateWhatsAppLink,
  sendWhatsAppNotification,
} from '../utils/whatsapp.js';
import { BookingStatus, PaymentStatus, BookingType } from '../enums/index.js';

/**
 * BookingService
 * Encapsulates all business logic: pricing calculation, customer linking,
 * status transitions, vehicle/driver auto-dispatch, and WhatsApp dispatch.
 */
export class BookingService extends BaseService {
  constructor() {
    super(bookingRepository);
  }

  /**
   * Server-side Price Calculation Engine
   */
  calculateTotalPrice({ isVehicleRentalOnly, isRentalWithoutDriver, pkg, numPersons, customFeatures, transportVehicle, rentalAssets }) {
    let rentalAssetsCharge = 0;
    if (Array.isArray(rentalAssets)) {
      rentalAssetsCharge = rentalAssets.reduce((sum, item) => {
        return sum + (Number(item.rentPrice || 0) * (Number(item.quantity) || 1));
      }, 0);
    }

    if (isVehicleRentalOnly) {
      const rentalDays = Number(customFeatures?.rentalDays) || 1;
      const vehicleBaseRate = Number(transportVehicle?.price) > 0 ? Number(transportVehicle.price) : 3200;
      let total = vehicleBaseRate * rentalDays;

      if (customFeatures?.foodIncluded) total += 450 * numPersons * rentalDays;
      if (customFeatures?.campfireIncluded) total += 800;
      if (customFeatures?.photographyIncluded) total += 1200;

      return total + rentalAssetsCharge;
    }

    // Tour Package Pricing
    let basePrice = 0;
    if (pkg.priceUnit === 'per person') {
      basePrice = Number(pkg.price) * numPersons;
    } else {
      const jeepsNeeded = Math.ceil(numPersons / (pkg.maxSeats || 6));
      basePrice = Number(pkg.price) * Math.max(1, jeepsNeeded);
    }

    // Feature customizations
    if (customFeatures) {
      if (customFeatures.foodIncluded === false) {
        basePrice = Math.max(1000, basePrice - (450 * numPersons));
      }
      if (customFeatures.stayIncluded === false) {
        basePrice = Math.max(1000, basePrice - (1200 * numPersons));
      }
      if (customFeatures.campfireIncluded) basePrice += 800;
      if (customFeatures.photographyIncluded) basePrice += 1200;
    }

    let vehicleCharge = 0;
    if (transportVehicle && transportVehicle.price) {
      vehicleCharge = Number(transportVehicle.price) || 0;
    }

    return basePrice + vehicleCharge + rentalAssetsCharge;
  }

  /**
   * Process complete booking creation workflow
   */
  async processBookingCreation(payload) {
    const {
      packageId,
      bookingType = BookingType.TOUR_PACKAGE,
      customFeatures,
      customerName,
      phone,
      email,
      travelDate,
      persons,
      pickupLocation,
      specialRequests,
      transportVehicle,
      rentalAssets,
      driverOption,
    } = payload;

    const isRentalWithDriver =
      bookingType === 'vehicle_rental_with_driver' ||
      (bookingType === BookingType.VEHICLE_RENTAL && customFeatures?.rentalOption === 'with_driver');
    const isRentalWithoutDriver =
      bookingType === 'vehicle_rental_without_driver' ||
      (bookingType === BookingType.VEHICLE_RENTAL && customFeatures?.rentalOption === 'without_driver');
    const isVehicleRentalOnly = isRentalWithDriver || isRentalWithoutDriver;

    // Validate Package
    let pkg = null;
    if (packageId) {
      pkg = await bookingRepository.findPackageById(packageId);
    }
    if (!pkg && !isVehicleRentalOnly) {
      pkg = await bookingRepository.findDefaultActivePackage();
      if (!pkg) {
        const err = new Error('Selected tour package was not found.');
        err.statusCode = 404;
        throw err;
      }
    }

    if (pkg && pkg.status !== 'active' && !isVehicleRentalOnly) {
      const err = new Error('This package is currently unavailable for booking.');
      err.statusCode = 400;
      throw err;
    }

    const numPersons = parseInt(persons, 10) || 1;

    // Calculate Price
    const calculatedTotalPrice = this.calculateTotalPrice({
      isVehicleRentalOnly,
      isRentalWithoutDriver,
      pkg,
      numPersons,
      customFeatures,
      transportVehicle,
      rentalAssets,
    });

    const cleanPhoneDigits = (phone && typeof phone === 'string' ? phone.trim().replace(/\D/g, '') : '');
    const cleanPhone = cleanPhoneDigits.length > 10 ? cleanPhoneDigits.slice(-10) : cleanPhoneDigits;

    // Upsert Customer
    const customer = await bookingRepository.upsertCustomer({
      name: customerName.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : null,
      city: pickupLocation ? pickupLocation.trim() : null,
      spentAmount: calculatedTotalPrice,
    });

    // Lookup Category and Tier records
    let categoryDoc = null;
    let tierDoc = null;
    if (pkg) {
      const catTier = await bookingRepository.findCategoryAndTier(pkg.category, pkg.tier);
      categoryDoc = catTier.categoryDoc;
      tierDoc = catTier.tierDoc;
    }

    // Assemble packageSnapshot
    const snapshot = isVehicleRentalOnly
      ? {
          title: isRentalWithoutDriver
            ? `Vehicle Rental - Self Drive (${transportVehicle?.name || 'Private Vehicle'})`
            : `Vehicle Rental - With Mountain Driver (${transportVehicle?.name || 'Private Vehicle'})`,
          slug: isRentalWithoutDriver ? 'vehicle-rental-self-drive' : 'vehicle-rental-with-driver',
          category: 'family',
          tier: 'premium',
          destination: customFeatures?.destinationDetails || pickupLocation || 'Munnar & Hill Corridors',
          duration: { days: customFeatures?.rentalDays || 1, nights: Math.max(0, (customFeatures?.rentalDays || 1) - 1) },
          price: calculatedTotalPrice,
          priceUnit: 'per vehicle',
          images: transportVehicle?.images?.length
            ? transportVehicle.images
            : ['https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80'],
          itinerary: [],
          inclusions: isRentalWithoutDriver
            ? ['Clean & sanitised 4x4 Jeep / SUV', 'Full RC, Insurance & Permits', '24/7 Hill Breakdown Assistance', 'Zero Security Deposit Scheme']
            : ['Certified Hill Terrain Driver', 'Driver Daily Batta & Meals', 'Fuel for chosen corridor', 'Full Vehicle Insurance'],
          exclusions: isRentalWithoutDriver ? ['Fuel / Petrol / Diesel', 'Toll & Parking Fees'] : ['Personal Sightseeing Entrance Tickets'],
        }
      : {
          title: pkg.title,
          slug: pkg.slug,
          category: pkg.category,
          tier: pkg.tier,
          destination: pkg.destination,
          duration: pkg.duration,
          price: calculatedTotalPrice,
          priceUnit: pkg.priceUnit,
          images: pkg.images,
          itinerary: pkg.itinerary,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
        };

    const bookingId = await generateBookingId();

    const newBooking = await bookingRepository.create({
      bookingId,
      customerId: customer ? customer.id : null,
      packageId: pkg ? pkg.id : null,
      categoryId: categoryDoc ? categoryDoc.id : null,
      tierId: tierDoc ? tierDoc.id : null,
      customerName: customerName.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : null,
      pickupLocation: pickupLocation.trim(),
      travelDate: new Date(travelDate),
      persons: numPersons,
      bookingType,
      specialRequests: specialRequests ? specialRequests.trim() : null,
      packageSnapshot: snapshot,
      transportVehicle: transportVehicle || null,
      rentalAssets: Array.isArray(rentalAssets) ? rentalAssets : [],
      customFeatures: {
        ...(customFeatures || {}),
        calculatedTotalPrice,
        driverOption: isRentalWithoutDriver ? 'self_drive' : driverOption || 'with_driver',
      },
      totalPrice: calculatedTotalPrice,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    });

    // Generate WhatsApp URL
    const whatsappMessage = formatBookingWhatsAppMessage(newBooking);
    const adminPhone = process.env.ADMIN_WHATSAPP || '919840123456';
    const whatsappUrl = generateWhatsAppLink(adminPhone, whatsappMessage);

    return {
      booking: newBooking,
      whatsappUrl,
      whatsappMessage,
    };
  }

  /**
   * Filtered bookings with pagination
   */
  async getBookings(filters) {
    return bookingRepository.findBookingsFiltered(filters);
  }

  /**
   * Get single booking with all details
   */
  async getBookingById(id) {
    const rawBooking = await bookingRepository.findBookingWithDetails(id);
    if (!rawBooking) {
      const err = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }
    const booking = rawBooking.toJSON();
    booking.customer = booking.customerDetails || booking.customerId;
    booking.package = booking.packageDetails || booking.packageId;
    booking.categoryRef = booking.categoryDetails || booking.categoryId;
    booking.tierRef = booking.tierDetails || booking.tierId;
    return booking;
  }

  /**
   * Update booking status and handle driver/vehicle dispatch state machine
   */
  async updateBookingStatus(id, { status, notes, startInspection }) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      const err = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }

    const prevStatus = booking.status;

    if (status) booking.status = status;
    if (notes !== undefined) booking.notes = notes;
    if (startInspection !== undefined) booking.startInspection = startInspection;

    await booking.save();

    // If trip started (in_progress), update vehicle & driver to on_tour
    if (status === 'in_progress' && startInspection) {
      try {
        const vehicleId = startInspection.vehicleId || booking.transportVehicle?.vehicleId;
        const vehicleReg = startInspection.vehicleReg || booking.transportVehicle?.regNumber;
        const vehicle = await bookingRepository.findVehicle(vehicleId, vehicleReg);

        if (vehicle) {
          const activeTripData = {
            bookingId: booking.bookingId,
            customerName: booking.customerName,
            driverName: startInspection.driverName || vehicle.driverName,
            driverPhone: startInspection.driverPhone || vehicle.driverPhone,
            startOdometer: startInspection.odometerKm || vehicle.currentOdometerKm,
            fuelLevel: startInspection.fuelLevel || '100%',
            photos: startInspection.photos || {},
            safetyChecklist: startInspection.safetyChecklist || {},
            remarks: startInspection.remarks || '',
            startedAt: new Date().toISOString(),
          };

          const currentHistory = Array.isArray(vehicle.tripInspectionHistory) ? vehicle.tripInspectionHistory : [];
          vehicle.status = 'on_tour';
          if (startInspection.odometerKm) vehicle.currentOdometerKm = Number(startInspection.odometerKm);
          vehicle.currentTrip = activeTripData;
          vehicle.tripInspectionHistory = [activeTripData, ...currentHistory];
          await vehicle.save();
        }

        const driver = await bookingRepository.findDriver(startInspection.driverId, startInspection.driverName);
        if (driver) {
          driver.status = 'on_tour';
          await driver.save();
        }
      } catch (vehErr) {
        console.warn('Error updating vehicle/driver on trip start:', vehErr.message);
      }
    }

    // If trip completed or cancelled, release vehicle & driver back to available
    if ((status === 'completed' || status === 'cancelled') && prevStatus === 'in_progress') {
      try {
        const insp = booking.startInspection || {};
        const vehicle = await bookingRepository.findVehicle(insp.vehicleId || booking.transportVehicle?.vehicleId, insp.vehicleReg || booking.transportVehicle?.regNumber);
        if (vehicle && vehicle.status === 'on_tour') {
          vehicle.status = 'available';
          vehicle.currentTrip = null;
          await vehicle.save();
        }

        const driver = await bookingRepository.findDriver(insp.driverId, insp.driverName);
        if (driver && driver.status === 'on_tour') {
          driver.status = 'available';
          if (status === 'completed') {
            driver.totalTripsCompleted = (driver.totalTripsCompleted || 0) + 1;
          }
          await driver.save();
        }
      } catch (relErr) {
        console.warn('Error releasing vehicle/driver on trip finish:', relErr.message);
      }
    }

    // Auto-generate or sync TripSettlement account in Ledger when confirmed or completed
    let generatedSettlement = null;
    if (status === 'confirmed' || status === 'completed') {
      try {
        const partnerTieupService = (await import('./partnerTieupService.js')).default;
        const settleResult = await partnerTieupService.generateSettlementForBooking(booking, { saveToLedger: true });
        generatedSettlement = settleResult?.savedSettlement || null;
      } catch (settleErr) {
        console.warn('Auto trip settlement generation warning:', settleErr.message);
      }
    }

    return {
      booking,
      settlement: generatedSettlement,
    };
  }

  /**
   * Generate customer confirmation WhatsApp URL and mark sent
   */
  async sendCustomerWhatsApp(id) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      const err = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }

    booking.whatsappSent = true;
    await booking.save();

    const customerMessage = formatCustomerConfirmationMessage(booking);
    const whatsappUrl = generateWhatsAppLink(booking.phone, customerMessage);

    return {
      whatsappUrl,
      customerMessage,
    };
  }

  /**
   * Export bookings to CSV with CWE-1236 injection protection
   */
  async exportBookingsCsv() {
    const bookings = await bookingRepository.findAllForExport();

    const headers = [
      'Booking ID',
      'Customer Name',
      'Phone',
      'Email',
      'Package Title',
      'Category',
      'Tier',
      'Destination',
      'Travel Date',
      'Persons',
      'Pickup Location',
      'Total Price (INR)',
      'Status',
      'Created At',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=\+\-@\t\r]/.test(str)) str = `'${str}`;
      return `"${str}"`;
    };

    const safeFormatDate = (d) => {
      if (!d) return '';
      const parsed = new Date(d);
      return !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : '';
    };

    const rows = bookings.map((b) => [
      escapeCsv(b.bookingId),
      escapeCsv(b.customerName),
      escapeCsv(b.phone),
      escapeCsv(b.email || ''),
      escapeCsv(b.packageSnapshot?.title || ''),
      escapeCsv(b.packageSnapshot?.category || ''),
      escapeCsv(b.packageSnapshot?.tier || ''),
      escapeCsv(b.packageSnapshot?.destination || ''),
      escapeCsv(safeFormatDate(b.travelDate)),
      escapeCsv(b.persons),
      escapeCsv(b.pickupLocation),
      escapeCsv(b.totalPrice),
      escapeCsv(b.status),
      escapeCsv(safeFormatDate(b.createdAt)),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export default new BookingService();
