import { IBooking, PackageCategory, PackageTier } from '../types';

export const DEFAULT_WHATSAPP_NUMBER: string =
  import.meta.env.VITE_WHATSAPP_NUMBER || '918111039182';

export function formatCategoryLabel(cat?: PackageCategory | string): string {
  if (!cat) return '';
  return cat.toLowerCase() === 'couple' ? 'Couple Package' : 'Stranger Package';
}

export function formatTierLabel(tier?: PackageTier | string): string {
  if (!tier) return '';
  return tier.toLowerCase() === 'extra_premium' ? 'Extra Premium' : 'Premium';
}

/**
 * Builds the exact required booking WhatsApp message string
 */
export function buildBookingWhatsAppMessage(booking: Partial<IBooking> & { packageTitle?: string }): string {
  const travelDateFormatted = booking.travelDate
    ? new Date(booking.travelDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'To be confirmed';

  const isVehicleRentalOnly = booking.bookingType === 'vehicle_rental_with_driver';
  const cf = booking.customFeatures;

  const categoryLabel = formatCategoryLabel(
    booking.packageSnapshot?.category || (booking as any).category
  );
  const tierLabel = formatTierLabel(
    booking.packageSnapshot?.tier || (booking as any).tier
  );
  const packageTitle = isVehicleRentalOnly
    ? 'Vehicle Rental Only (with Driver)'
    : booking.packageSnapshot?.title || booking.packageTitle || 'Hill-Station Tour';

  const priceFormatted = Number(booking.totalPrice || 0).toLocaleString('en-IN');

  const lines = [
    isVehicleRentalOnly
      ? '🚗 Vehicle Rental Booking – Hills Angel Tours'
      : '🌿 Tour Package Booking – Hills Angel Tours',
    `Booking ID: ${booking.bookingId || 'PENDING'}`,
    `Customer: ${booking.customerName || ''}`,
    `Phone: ${booking.phone || ''}`,
    `Booking Type: ${isVehicleRentalOnly ? '🚗 Vehicle Only (with Driver)' : '🌿 Tour Package Plan'}`,
    `Plan/Package: ${packageTitle}`,
  ];

  if (!isVehicleRentalOnly && (categoryLabel || tierLabel)) {
    lines.push(`Category/Tier: ${categoryLabel} (${tierLabel})`);
  }

  lines.push(`Travel Date: ${travelDateFormatted}`);
  lines.push(`Travellers: ${booking.persons || 1} Person(s)`);
  lines.push(`Pickup Point: ${booking.pickupLocation || 'Office / Collection Depot'}`);

  // Destination / Route details
  if (isVehicleRentalOnly) {
    const dest = cf?.destinationDetails || 'Open Route / Directed by Customer on Trip';
    lines.push(`Destination: ${dest}`);
  }

  // Plan Customizations breakdown
  if (cf) {
    lines.push('--- Plan Customizations ---');
    lines.push(`🍽️ Food: ${cf.foodIncluded ? 'Included (Hill-style Meals)' : 'Not Included / Self-Dining (Food Vena)'}`);
    lines.push(`🏡 Stay: ${cf.stayIncluded ? 'Included (Resort/Camp)' : 'Not Included (Vehicle Only)'}`);
    if (cf.campfireIncluded) {
      lines.push('🔥 Campfire & BBQ: Included (+₹800)');
    }
    if (cf.photographyIncluded) {
      lines.push('📸 GoPro 5K Kit: Included (+₹1,200)');
    }
    lines.push('🪪 Chauffeur: Dedicated Hill Driver Included');
  }

  if (booking.transportVehicle?.name) {
    const vPrice = Number(booking.transportVehicle.price || 0);
    lines.push(`🚙 Vehicle: ${booking.transportVehicle.name}${vPrice > 0 ? ` (+₹${vPrice.toLocaleString('en-IN')})` : ''}`);
  }

  if (booking.rentalAssets && booking.rentalAssets.length > 0) {
    const assetsText = booking.rentalAssets.map(a => `${a.name} (+₹${Number(a.rentPrice).toLocaleString('en-IN')})`).join(', ');
    lines.push(`Rental Assets: ${assetsText}`);
  }

  lines.push(`Total Estimated Price: ₹${priceFormatted}`);

  const notes = booking.specialRequests || booking.notes;
  if (notes && notes.trim()) {
    lines.push(`Notes/Requests: ${notes.trim()}`);
  }

  return lines.join('\n');
}

/**
 * Generates direct wa.me link
 */
export function getWhatsAppUrl(phone: string = DEFAULT_WHATSAPP_NUMBER, text: string = ''): string {
  const cleanPhone = (phone || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Helper to open WhatsApp smoothly on mobile or desktop without getting blocked,
 * with strict URL validation to prevent javascript: or malicious protocol injection.
 */
export function openWhatsAppSafely(url: string): void {
  if (!url || typeof url !== 'string') return;
  
  // Enforce secure WhatsApp domains
  const isSafeWhatsAppUrl =
    url.startsWith('https://wa.me/') ||
    url.startsWith('https://api.whatsapp.com/') ||
    url.startsWith('https://web.whatsapp.com/');

  if (!isSafeWhatsAppUrl) {
    console.warn('[Security] Refused to open non-WhatsApp protocol/URL:', url);
    return;
  }

  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = url;
    }
  } catch (err) {
    window.location.href = url;
  }
}
