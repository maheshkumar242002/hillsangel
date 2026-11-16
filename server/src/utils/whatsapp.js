/**
 * WhatsApp Helper for Hills Angel Tours and Travels
 * Formats notification messages and creates wa.me links.
 * Also includes commented placeholder logic for Meta WhatsApp Cloud API integration.
 */

export function formatCategoryLabel(cat) {
  if (!cat) return '';
  if (cat.toLowerCase() === 'family') return 'Family Trip Safari';
  if (cat.toLowerCase() === 'friends') return 'Friends Trip Safari';
  return cat;
}

export function formatTierLabel(tier) {
  if (!tier) return '';
  return tier.toLowerCase() === 'extra_premium' ? 'Extra Premium' : 'Premium';
}

/**
 * Formats a booking confirmation text message
 */
export function formatBookingWhatsAppMessage(booking) {
  const travelDateFormatted = booking.travelDate
    ? new Date(booking.travelDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'To be confirmed';

  const cf = booking.customFeatures;
  const isRentalWithDriver =
    booking.bookingType === 'vehicle_rental_with_driver' ||
    (booking.bookingType === 'vehicle_rental' && cf?.rentalOption === 'with_driver');
  const isRentalWithoutDriver =
    booking.bookingType === 'vehicle_rental_without_driver' ||
    (booking.bookingType === 'vehicle_rental' && cf?.rentalOption === 'without_driver');
  const isVehicleRentalOnly = isRentalWithDriver || isRentalWithoutDriver;

  const categoryLabel = formatCategoryLabel(
    booking.packageSnapshot?.category || booking.category
  );
  const tierLabel = formatTierLabel(
    booking.packageSnapshot?.tier || booking.tier
  );
  const packageTitle = isVehicleRentalOnly
    ? isRentalWithoutDriver
      ? 'Vehicle Rental (Self-Drive / Without Driver)'
      : 'Vehicle Rental (With Mountain Driver)'
    : booking.packageSnapshot?.title || booking.package?.title || 'Hill-Station Package';

  const priceFormatted = Number(booking.totalPrice || 0).toLocaleString('en-IN');

  const lines = [
    isRentalWithoutDriver
      ? '🔑 *Vehicle Rental (Self-Drive) – Hills Angel Tours*'
      : isRentalWithDriver
      ? '🚗 *Vehicle Rental (With Driver) – Hills Angel Tours*'
      : '🌿 *Tour Package Booking – Hills Angel Tours*',
    `*Booking ID:* ${booking.bookingId}`,
    `*Customer:* ${booking.customerName}`,
    `*Phone:* ${booking.phone}`,
    `*Booking Type:* ${
      isRentalWithoutDriver
        ? '🔑 Self-Drive Rental (Without Driver)'
        : isRentalWithDriver
        ? '🚗 Vehicle Rental (With Mountain Driver)'
        : '🌿 Tour Package Plan'
    }`,
    `*Plan/Package:* ${packageTitle}`,
  ];

  if (!isVehicleRentalOnly && (categoryLabel || tierLabel)) {
    lines.push(`*Category/Tier:* ${categoryLabel} (${tierLabel})`);
  }

  lines.push(`*Travel Date:* ${travelDateFormatted}`);
  lines.push(`*Travellers:* ${booking.persons}`);
  lines.push(`*Pickup:* ${booking.pickupLocation}`);

  if (isVehicleRentalOnly) {
    const dest = cf?.destinationDetails || 'Open Route / Directed by Customer on Trip';
    lines.push(`*Destination:* ${dest}`);
  }

  if (cf) {
    if (isRentalWithoutDriver) {
      lines.push('*--- Self-Drive Details ---*');
      lines.push('🔑 *Mode:* Self Drive (Customer Driving)');
      if (cf.drivingLicenseNumber) {
        lines.push(`🪪 *Driver License:* ${cf.drivingLicenseNumber}`);
      }
      lines.push('🛡️ *Security Deposit:* ₹3,000 (Refundable upon vehicle inspection)');
      lines.push('⛽ *Fuel Policy:* Same-to-Same / Full-to-Full');
    } else if (isRentalWithDriver) {
      lines.push('*--- Rental Options ---*');
      lines.push('🚖 *Driver:* Dedicated Mountain Pilot Included');
    } else {
      lines.push('*--- Plan Customizations ---*');
      lines.push(`🍽️ *Food:* ${cf.foodIncluded ? 'Included (Hill Meals)' : 'Not Included / Self-Dining (Food Vena)'}`);
      lines.push(`🏡 *Stay:* ${cf.stayIncluded ? 'Included (Resort/Camp)' : 'Not Included (Vehicle Only)'}`);
    }
    if (cf.campfireIncluded) {
      lines.push('🔥 *Campfire & BBQ:* Included (+₹800)');
    }
    if (cf.photographyIncluded) {
      lines.push('📸 *GoPro 5K Kit:* Included (+₹1,200)');
    }
    if (!isRentalWithoutDriver) {
      lines.push('🪪 *Chauffeur:* Dedicated Mountain Driver Included');
    }
  }

  if (booking.transportVehicle?.name) {
    const vehPrice = Number(booking.transportVehicle.price || 0);
    lines.push(`🚙 *Transport Vehicle:* ${booking.transportVehicle.name}${vehPrice > 0 ? ` (+₹${vehPrice.toLocaleString('en-IN')})` : ' (Included)'}`);
  }

  if (booking.rentalAssets && booking.rentalAssets.length > 0) {
    const assetsList = booking.rentalAssets.map(a => `${a.name} (+₹${Number(a.rentPrice).toLocaleString('en-IN')})`).join(', ');
    lines.push(`*Rental Assets:* ${assetsList}`);
  }

  lines.push(`*Total Price:* ₹${priceFormatted}`);

  if (booking.specialRequests && booking.specialRequests.trim()) {
    lines.push(`*Notes:* ${booking.specialRequests.trim()}`);
  }

  return lines.join('\n');
}

/**
 * Generates direct wa.me URL
 * @param {string} phone - Target phone number in international format (e.g. 918111039182)
 * @param {string} text - Raw message text
 * @returns {string} wa.me URL with URL-encoded query
 */
export function generateWhatsAppLink(phone, text) {
  const cleanPhone = (phone || '918111039182').replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates an admin confirmation message to be sent to the customer
 */
export function formatCustomerConfirmationMessage(booking) {
  const travelDateFormatted = booking.travelDate
    ? new Date(booking.travelDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return [
    `✨ *Hello ${booking.customerName}!*`,
    `Greetings from *Hills Angel Tours and Travels* 🌿`,
    ``,
    `We have received your booking (*${booking.bookingId}*) for *${booking.packageSnapshot?.title}*.`,
    `📅 *Travel Date:* ${travelDateFormatted}`,
    `👥 *Guests:* ${booking.persons}`,
    `📍 *Pickup:* ${booking.pickupLocation}`,
    `💰 *Total Amount:* ₹${Number(booking.totalPrice).toLocaleString('en-IN')}`,
    `📌 *Status:* ${booking.status.toUpperCase()}`,
    ``,
    `Our travel coordinator will connect with you shortly with your detailed driver and hotel itinerary. Feel free to reply here if you have any questions!`,
    ``,
    `Warm regards,`,
    `Hills Angel Tours Team`,
    `📞 +91 81110 39182`,
  ].join('\n');
}

/**
 * PLACEHOLDER FOR WHATSAPP CLOUD API:
 *
 * To send automatic server-side WhatsApp messages via Meta Graph API:
 *
 * export async function sendServerWhatsAppCloudApi({ to, templateName, components }) {
 *   const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
 *   const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
 *   if (!token || !phoneNumberId) {
 *     console.warn('[WhatsApp Cloud API] Credentials not configured.');
 *     return false;
 *   }
 *
 *   const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
 *     method: 'POST',
 *     headers: {
 *       'Authorization': `Bearer ${token}`,
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify({
 *       messaging_product: 'whatsapp',
 *       to,
 *       type: 'template',
 *       template: {
 *         name: templateName,
 *         language: { code: 'en' },
 *         components,
 *       },
 *     }),
 *   });
 *   return await response.json();
 * }
 */
