import { IBooking, IBookingInput, IBookingResponse, BookingStatus, IPackage } from '../types';
import { initialMockBookings, mockPackages } from '../data/mockData';
import { buildBookingWhatsAppMessage, getWhatsAppUrl, DEFAULT_WHATSAPP_NUMBER } from '../utils/whatsapp';

export interface GetBookingsParams {
  status?: string;
  category?: string;
  tier?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface BookingsApiResponse {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  bookings: IBooking[];
}

const STORAGE_KEY = 'ha_mock_bookings';

function getStoredBookings(): IBooking[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }
  return [...initialMockBookings];
}

function saveBookings(bookings: IBooking[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (e) {
    // ignore
  }
}

// Public booking creation
export const createBooking = async (bookingData: IBookingInput): Promise<IBookingResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 120));

  // Find package
  let packagesList: IPackage[] = [];
  try {
    const stored = localStorage.getItem('ha_mock_packages');
    packagesList = stored ? JSON.parse(stored) : mockPackages;
  } catch (e) {
    packagesList = mockPackages;
  }

  const pkg =
    packagesList.find((p) => p._id === bookingData.packageId || p.id === bookingData.packageId) ||
    packagesList[0];

  const bookingId = `HAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Calculate pricing
  const persons = Number(bookingData.persons) || 1;
  const baseRate = pkg?.price || 15000;
  let totalPrice = pkg?.category === 'couple' ? baseRate : baseRate * persons;

  if (bookingData.transportVehicle?.price) {
    totalPrice += Number(bookingData.transportVehicle.price);
  }

  if (bookingData.rentalAssets && bookingData.rentalAssets.length > 0) {
    const gearTotal = bookingData.rentalAssets.reduce(
      (sum, item) => sum + (Number(item.rentPrice) || 0) * (Number(item.quantity) || 1),
      0
    );
    totalPrice += gearTotal;
  }

  const newBooking: IBooking = {
    _id: `bk-${Date.now()}`,
    id: `bk-${Date.now()}`,
    bookingId,
    customerName: bookingData.customerName,
    phone: bookingData.phone,
    email: bookingData.email,
    pickupLocation: bookingData.pickupLocation,
    specialRequests: bookingData.specialRequests,
    travelDate: bookingData.travelDate,
    persons,
    package: pkg._id || pkg.id || 'pkg-1',
    packageSnapshot: {
      title: pkg.title,
      slug: pkg.slug,
      category: pkg.category,
      tier: pkg.tier,
      destination: pkg.destination,
      price: pkg.price,
      priceUnit: pkg.priceUnit,
    },
    transportVehicle: bookingData.transportVehicle,
    rentalAssets: bookingData.rentalAssets,
    totalPrice,
    status: 'pending',
    whatsappSent: true,
    createdAt: new Date().toISOString(),
  };

  // Save to stored bookings
  const bookings = getStoredBookings();
  bookings.unshift(newBooking);
  saveBookings(bookings);

  // Generate WhatsApp message and URL
  const whatsappMessage = buildBookingWhatsAppMessage(newBooking);
  const whatsappUrl = getWhatsAppUrl(DEFAULT_WHATSAPP_NUMBER, whatsappMessage);

  return {
    success: true,
    message: 'Booking submitted successfully! WhatsApp concierge is ready.',
    booking: newBooking,
    whatsappUrl,
    whatsappMessage,
  };
};

// Admin booking endpoints
export const getBookings = async (params: GetBookingsParams = {}): Promise<BookingsApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 80));

  let list = getStoredBookings();

  if (params.status && params.status !== 'all') {
    list = list.filter((b) => b.status === params.status);
  }

  if (params.category && params.category !== 'all') {
    list = list.filter(
      (b) => b.packageSnapshot?.category?.toLowerCase() === params.category?.toLowerCase()
    );
  }

  if (params.tier && params.tier !== 'all') {
    list = list.filter(
      (b) => b.packageSnapshot?.tier?.toLowerCase() === params.tier?.toLowerCase()
    );
  }

  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter(
      (b) =>
        b.customerName.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.bookingId.toLowerCase().includes(q) ||
        b.packageSnapshot?.title?.toLowerCase().includes(q)
    );
  }

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

  return {
    success: true,
    count: paginated.length,
    total,
    totalPages,
    currentPage: page,
    bookings: paginated,
  };
};

export const getBookingById = async (id: string): Promise<{ success: boolean; booking: IBooking }> => {
  const list = getStoredBookings();
  const booking = list.find((b) => b._id === id || b.id === id || b.bookingId === id);
  if (!booking) throw new Error('Booking not found');
  return { success: true, booking };
};

export const updateBookingStatus = async (
  id: string,
  statusData: { status?: BookingStatus; notes?: string }
): Promise<{ success: boolean; message: string; booking: IBooking }> => {
  const list = getStoredBookings();
  const index = list.findIndex((b) => b._id === id || b.id === id || b.bookingId === id);
  if (index === -1) throw new Error('Booking not found');

  if (statusData.status) list[index].status = statusData.status;
  if (statusData.notes !== undefined) list[index].notes = statusData.notes;
  saveBookings(list);

  return {
    success: true,
    message: 'Booking status updated successfully (demo mode)',
    booking: list[index],
  };
};

export const deleteBooking = async (id: string): Promise<{ success: boolean; message: string }> => {
  let list = getStoredBookings();
  list = list.filter((b) => b._id !== id && b.id !== id && b.bookingId !== id);
  saveBookings(list);
  return {
    success: true,
    message: 'Booking deleted successfully (demo mode)',
  };
};

export const sendCustomerWhatsApp = async (
  id: string
): Promise<{ success: boolean; message: string; whatsappUrl: string; customerMessage: string }> => {
  const { booking } = await getBookingById(id);
  const customerMessage = buildBookingWhatsAppMessage(booking);
  const whatsappUrl = getWhatsAppUrl(booking.phone, customerMessage);

  return {
    success: true,
    message: 'WhatsApp message prepared',
    whatsappUrl,
    customerMessage,
  };
};

export const getExportBookingsCsvUrl = (): string => {
  return '#';
};
