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

  const categoryLabel = formatCategoryLabel(
    booking.packageSnapshot?.category || (booking as any).category
  );
  const tierLabel = formatTierLabel(
    booking.packageSnapshot?.tier || (booking as any).tier
  );
  const packageTitle =
    booking.packageSnapshot?.title || booking.packageTitle || 'Hill-Station Tour';

  const priceFormatted = Number(booking.totalPrice || 0).toLocaleString('en-IN');

  const lines = [
    '🌿 New Booking – Hills Angel Tours and Travels',
    `Booking ID: ${booking.bookingId || 'PENDING'}`,
    `Name: ${booking.customerName || ''}`,
    `Phone: ${booking.phone || ''}`,
    `Package: ${packageTitle}`,
    `Category: ${categoryLabel}`,
    `Tier: ${tierLabel}`,
    `Travel Date: ${travelDateFormatted}`,
    `Persons: ${booking.persons || 1}`,
    `Pickup: ${booking.pickupLocation || ''}`,
  ];

  if (booking.transportVehicle?.name) {
    const vPrice = Number(booking.transportVehicle.price || 0);
    lines.push(`Transport Vehicle: ${booking.transportVehicle.name}${vPrice > 0 ? ` (+₹${vPrice.toLocaleString('en-IN')})` : ' (Included)'}`);
  }

  if (booking.rentalAssets && booking.rentalAssets.length > 0) {
    const assetsText = booking.rentalAssets.map(a => `${a.name} (+₹${Number(a.rentPrice).toLocaleString('en-IN')})`).join(', ');
    lines.push(`Rental Assets: ${assetsText}`);
  }

  lines.push(`Total Price: ₹${priceFormatted}`);

  const notes = booking.specialRequests || booking.notes;
  if (notes && notes.trim()) {
    lines.push(`Notes: ${notes.trim()}`);
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
 * Helper to open WhatsApp smoothly on mobile or desktop without getting blocked
 */
export function openWhatsAppSafely(url: string): void {
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = url;
    }
  } catch (err) {
    window.location.href = url;
  }
}
