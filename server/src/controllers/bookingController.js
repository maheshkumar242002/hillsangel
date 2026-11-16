import { Op } from 'sequelize';
import Booking from '../models/Booking.js';
import Package from '../models/Package.js';
import Customer from '../models/Customer.js';
import Category from '../models/Category.js';
import Tier from '../models/Tier.js';
import Settings from '../models/Settings.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import { generateBookingId } from '../utils/generateBookingId.js';
import {
  formatBookingWhatsAppMessage,
  formatCustomerConfirmationMessage,
  generateWhatsAppLink,
} from '../utils/whatsapp.js';

// @desc    Create a new booking (Public)
// @route   POST /api/bookings
// @access  Public (Rate limited)
export const createBooking = async (req, res, next) => {
  try {
    const {
      packageId,
      bookingType = 'tour_package',
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
    } = req.body;

    const isRentalWithDriver =
      bookingType === 'vehicle_rental_with_driver' ||
      (bookingType === 'vehicle_rental' && customFeatures?.rentalOption === 'with_driver');
    const isRentalWithoutDriver =
      bookingType === 'vehicle_rental_without_driver' ||
      (bookingType === 'vehicle_rental' && customFeatures?.rentalOption === 'without_driver');
    const isVehicleRentalOnly = isRentalWithDriver || isRentalWithoutDriver;

    // Strict Input Validations
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid customer name (at least 2 characters).',
      });
    }

    const cleanPhoneDigits = (phone && typeof phone === 'string' ? phone.trim().replace(/\D/g, '') : '');
    const cleanPhone = cleanPhoneDigits.length > 10 ? cleanPhoneDigits.slice(-10) : cleanPhoneDigits;
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number (e.g. 9840123456).',
      });
    }

    if (!pickupLocation || typeof pickupLocation !== 'string' || pickupLocation.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid pickup location.',
      });
    }

    if (!travelDate) {
      return res.status(400).json({
        success: false,
        message: 'Please select an intended travel date.',
      });
    }
    const parsedTravelDate = new Date(travelDate);
    if (isNaN(parsedTravelDate.getTime()) || parsedTravelDate.getFullYear() < 2020) {
      return res.status(400).json({
        success: false,
        message: 'Invalid travel date provided. Please select a valid calendar date.',
      });
    }

    // Persons validation
    const numPersons = parseInt(persons, 10);
    if (isNaN(numPersons) || numPersons < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of travellers must be at least 1.',
      });
    }

    // Validate package existence (or fallback for vehicle-only rentals)
    let pkg = null;
    if (packageId) {
      pkg = await Package.findByPk(packageId);
    }
    if (!pkg && !isVehicleRentalOnly) {
      // Find any default active package
      pkg = await Package.findOne({ where: { status: 'active' } });
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Selected tour package was not found.',
        });
      }
    }

    if (pkg && pkg.status !== 'active' && !isVehicleRentalOnly) {
      return res.status(400).json({
        success: false,
        message: 'This package is currently unavailable for booking.',
      });
    }

    // SERVER-SIDE PRICE CALCULATION
    let calculatedTotalPrice = 0;

    // Rental assets additional price
    let rentalAssetsCharge = 0;
    if (Array.isArray(rentalAssets)) {
      rentalAssetsCharge = rentalAssets.reduce((sum, item) => {
        return sum + (Number(item.rentPrice || 0) * (Number(item.quantity) || 1));
      }, 0);
    }

    if (isVehicleRentalOnly) {
      // Vehicle Rental Only with Driver
      const rentalDays = Number(customFeatures?.rentalDays) || 1;
      const vehicleBaseRate = Number(transportVehicle?.price) > 0 ? Number(transportVehicle.price) : 3200;
      let total = vehicleBaseRate * rentalDays;

      if (customFeatures?.foodIncluded) {
        total += 450 * numPersons * rentalDays;
      }
      if (customFeatures?.campfireIncluded) {
        total += 800;
      }
      if (customFeatures?.photographyIncluded) {
        total += 1200;
      }

      calculatedTotalPrice = total + rentalAssetsCharge;
    } else {
      // Tour Package Plan
      let basePrice = 0;
      if (pkg.priceUnit === 'per person') {
        basePrice = pkg.price * numPersons;
      } else {
        const jeepsNeeded = Math.ceil(numPersons / (pkg.maxSeats || 6));
        basePrice = pkg.price * Math.max(1, jeepsNeeded);
      }

      // Feature customizations (venum / vena)
      if (customFeatures) {
        if (customFeatures.foodIncluded === false) {
          // Food Vena discount
          basePrice = Math.max(1000, basePrice - (450 * numPersons));
        }
        if (customFeatures.stayIncluded === false) {
          // Stay Vena discount
          basePrice = Math.max(1000, basePrice - (1200 * numPersons));
        }
        if (customFeatures.campfireIncluded) {
          basePrice += 800;
        }
        if (customFeatures.photographyIncluded) {
          basePrice += 1200;
        }
      }

      let vehicleCharge = 0;
      if (transportVehicle && transportVehicle.price) {
        vehicleCharge = Number(transportVehicle.price) || 0;
      }

      calculatedTotalPrice = basePrice + vehicleCharge + rentalAssetsCharge;
    }

    // Find or create customer record in MySQL
    let customer = await Customer.findOne({ where: { phone: cleanPhone } });
    if (!customer) {
      customer = await Customer.create({
        name: customerName.trim(),
        phone: cleanPhone,
        email: email && typeof email === 'string' ? email.trim() : null,
        city: pickupLocation ? pickupLocation.trim() : null,
        totalBookings: 1,
        totalSpent: calculatedTotalPrice,
      });
    } else {
      customer.totalBookings = (customer.totalBookings || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + calculatedTotalPrice;
      if (email && !customer.email && typeof email === 'string') customer.email = email.trim();
      await customer.save();
    }

    // Lookup Category and Tier records
    let categoryDoc = null;
    let tierDoc = null;
    if (pkg) {
      [categoryDoc, tierDoc] = await Promise.all([
        Category.findOne({ where: { key: pkg.category } }),
        Tier.findOne({ where: { key: pkg.tier } }),
      ]);
    }

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
          priceUnit: 'per trip',
        }
      : {
          title: pkg?.title || 'Hill-Station Package',
          slug: pkg?.slug || 'hill-package',
          category: pkg?.category || 'family',
          tier: pkg?.tier || 'premium',
          destination: pkg?.destination || 'Munnar',
          duration: pkg?.duration || { days: 2, nights: 1 },
          price: pkg?.price || calculatedTotalPrice,
          priceUnit: pkg?.priceUnit || 'per group',
        };

    // Create the booking record with race-condition retry and jitter backoff
    let booking = null;
    let attempts = 0;
    while (!booking && attempts < 10) {
      attempts++;
      const bookingId = await generateBookingId();
      try {
        booking = await Booking.create({
          bookingId,
          bookingType,
          customFeatures: customFeatures || null,
          customerId: customer.id,
          categoryId: categoryDoc ? categoryDoc.id : null,
          tierId: tierDoc ? tierDoc.id : null,
          packageId: pkg ? pkg.id : null,
          packageSnapshot: snapshot,
          customerName: customerName.trim(),
          phone: cleanPhone,
          email: email && typeof email === 'string' ? email.trim() : null,
          travelDate: parsedTravelDate,
          persons: numPersons,
          pickupLocation: pickupLocation.trim(),
          specialRequests: specialRequests && typeof specialRequests === 'string' ? specialRequests.trim() : '',
          transportVehicle: transportVehicle || {
            name: 'Mahindra Commander 4x4 Safari Jeep',
            vehicleType: 'jeep',
            price: 0,
          },
          rentalAssets: Array.isArray(rentalAssets) ? rentalAssets : [],
          totalPrice: calculatedTotalPrice,
          status: 'pending',
        });
      } catch (createErr) {
        if (createErr.name === 'SequelizeUniqueConstraintError' && attempts < 10) {
          // Add small jitter backoff so concurrent threads don't repeatedly clash
          await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 50) + 10));
          continue;
        }
        throw createErr;
      }
    }

    // Increment seatsBooked for stranger package
    if (pkg && pkg.category === 'stranger') {
      pkg.seatsBooked = (pkg.seatsBooked || 0) + numPersons;
      await pkg.save();
    }

    // Fetch site settings for recipient WhatsApp number
    const settings = await Settings.findOne();
    const destinationWhatsApp =
      settings?.whatsappNumber || process.env.WHATSAPP_NUMBER || '918111039182';

    // Format WhatsApp message & URL
    const messageText = formatBookingWhatsAppMessage(booking);
    const whatsappUrl = generateWhatsAppLink(destinationWhatsApp, messageText);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      booking: {
        id: booking.id,
        _id: String(booking.id),
        bookingId: booking.bookingId,
        customer: booking.customerId,
        categoryRef: booking.categoryId,
        tierRef: booking.tierId,
        customerName: booking.customerName,
        phone: booking.phone,
        email: booking.email,
        packageTitle: booking.packageSnapshot?.title,
        category: booking.packageSnapshot?.category,
        tier: booking.packageSnapshot?.tier,
        destination: booking.packageSnapshot?.destination,
        travelDate: booking.travelDate,
        persons: booking.persons,
        pickupLocation: booking.pickupLocation,
        transportVehicle: booking.transportVehicle,
        rentalAssets: booking.rentalAssets,
        totalPrice: booking.totalPrice,
        status: booking.status,
        createdAt: booking.createdAt,
      },
      whatsappUrl,
      whatsappMessage: messageText,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all bookings with filters, search, and pagination
// @route   GET /api/bookings
// @access  Private (Admin)
export const getBookings = async (req, res, next) => {
  try {
    const {
      status,
      category,
      tier,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    if (status && status !== 'all') {
      where.status = status.toLowerCase();
    }

    if (category && category !== 'all') {
      // In MySQL, packageSnapshot is JSON
      where['packageSnapshot.category'] = category.toLowerCase();
    }

    if (tier && tier !== 'all') {
      where['packageSnapshot.tier'] = tier.toLowerCase();
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { bookingId: { [Op.like]: term } },
        { customerName: { [Op.like]: term } },
        { phone: { [Op.like]: term } },
      ];
    }

    if (startDate || endDate) {
      where.travelDate = {};
      if (startDate) where.travelDate[Op.gte] = new Date(startDate);
      if (endDate) where.travelDate[Op.lte] = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const { rows: rawBookings, count: total } = await Booking.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customerDetails' },
        { model: Package, as: 'packageDetails' },
        { model: Category, as: 'categoryDetails' },
        { model: Tier, as: 'tierDetails' },
      ],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: limitNum,
    });

    const bookings = rawBookings.map((b) => {
      const json = b.toJSON();
      json.customer = json.customerDetails || json.customerId;
      json.package = json.packageDetails || json.packageId;
      json.categoryRef = json.categoryDetails || json.categoryId;
      json.tierRef = json.tierDetails || json.tierId;
      return json;
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      bookings,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private (Admin)
export const getBookingById = async (req, res, next) => {
  try {
    const rawBooking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customerDetails' },
        { model: Package, as: 'packageDetails' },
        { model: Category, as: 'categoryDetails' },
        { model: Tier, as: 'tierDetails' },
      ],
    });

    if (!rawBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const booking = rawBooking.toJSON();
    booking.customer = booking.customerDetails || booking.customerId;
    booking.package = booking.packageDetails || booking.packageId;
    booking.categoryRef = booking.categoryDetails || booking.categoryId;
    booking.tierRef = booking.tierDetails || booking.tierId;

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update booking status and notes
// @route   PATCH /api/bookings/:id/status
// @access  Private (Admin)
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, notes, startInspection } = req.body;

    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const prevStatus = booking.status;

    if (status) {
      booking.status = status;
    }
    if (notes !== undefined) {
      booking.notes = notes;
    }
    if (startInspection !== undefined) {
      booking.startInspection = startInspection;
    }

    await booking.save();

    // If trip started (in_progress), update vehicle & driver to on_tour
    if (status === 'in_progress' && startInspection) {
      try {
        const vehicleId = startInspection.vehicleId || booking.transportVehicle?.vehicleId;
        const vehicleReg = startInspection.vehicleReg || booking.transportVehicle?.regNumber;

        let vehicle = null;
        if (vehicleId) {
          vehicle = await Vehicle.findByPk(vehicleId);
        }
        if (!vehicle && vehicleReg) {
          vehicle = await Vehicle.findOne({ where: { regNumber: vehicleReg } });
        }

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
          if (startInspection.odometerKm) {
            vehicle.currentOdometerKm = Number(startInspection.odometerKm);
          }
          vehicle.currentTrip = activeTripData;
          vehicle.tripInspectionHistory = [activeTripData, ...currentHistory];
          await vehicle.save();
        }

        // Driver update to on_tour
        const driverId = startInspection.driverId;
        const driverName = startInspection.driverName;
        let driver = null;
        if (driverId) {
          driver = await Driver.findByPk(driverId);
        }
        if (!driver && driverName) {
          driver = await Driver.findOne({ where: { name: driverName } });
        }
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
        const vehicleId = insp.vehicleId || booking.transportVehicle?.vehicleId;
        const vehicleReg = insp.vehicleReg || booking.transportVehicle?.regNumber;

        let vehicle = null;
        if (vehicleId) vehicle = await Vehicle.findByPk(vehicleId);
        if (!vehicle && vehicleReg) vehicle = await Vehicle.findOne({ where: { regNumber: vehicleReg } });

        if (vehicle && vehicle.status === 'on_tour') {
          vehicle.status = 'available';
          vehicle.currentTrip = null;
          await vehicle.save();
        }

        const driverId = insp.driverId;
        const driverName = insp.driverName;
        let driver = null;
        if (driverId) driver = await Driver.findByPk(driverId);
        if (!driver && driverName) driver = await Driver.findOne({ where: { name: driverName } });

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
        const { generateSettlementForBooking } = await import('./partnerTieupController.js');
        const settleResult = await generateSettlementForBooking(booking, { saveToLedger: true });
        generatedSettlement = settleResult?.savedSettlement || null;
      } catch (settleErr) {
        console.warn('Auto trip settlement generation warning:', settleErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Booking marked as ${booking.status}.${generatedSettlement ? ` Accounts auto-settled (${generatedSettlement.settlementCode}).` : ''}`,
      booking,
      settlement: generatedSettlement,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin)
export const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    await booking.destroy();

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate customer confirmation WhatsApp URL and mark sent
// @route   POST /api/bookings/:id/send-whatsapp
// @access  Private (Admin)
export const sendCustomerWhatsApp = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    booking.whatsappSent = true;
    await booking.save();

    const customerMessage = formatCustomerConfirmationMessage(booking);
    const whatsappUrl = generateWhatsAppLink(booking.phone, customerMessage);

    res.status(200).json({
      success: true,
      message: 'Customer WhatsApp link generated.',
      whatsappUrl,
      customerMessage,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export bookings to CSV
// @route   GET /api/bookings/export/csv
// @access  Private (Admin)
export const exportBookingsCsv = async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({ order: [['createdAt', 'DESC']] });

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
      // Neutralize CSV / Excel formula injection (CWE-1236)
      if (/^[=\+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
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

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="hills-angels-bookings-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
