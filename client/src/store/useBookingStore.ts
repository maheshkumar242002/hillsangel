import { create } from 'zustand';
import {
  ITransportVehicleSelection,
  IRentalAssetSelection,
  ICustomPlanFeatures,
  IBookingInput,
  IBooking,
  IBookingResponse,
  BookingStatus,
  ITripStartInspection,
} from '../types';
import {
  createBooking as apiCreateBooking,
  getBookings,
  getBookingById as apiGetBookingById,
  updateBookingStatus as apiUpdateBookingStatus,
  deleteBooking as apiDeleteBooking,
  sendCustomerWhatsApp as apiSendCustomerWhatsApp,
  GetBookingsParams,
} from '../api/bookings';

export interface BookingStoreState {
  // Booking Draft
  packageId: string;
  travelDate: string;
  persons: number;
  rentalDays: number;
  selectedVehicle: ITransportVehicleSelection | null;
  selectedRentalAssets: IRentalAssetSelection[];
  customFeatures: Partial<ICustomPlanFeatures>;
  submitting: boolean;
  error: string | null;

  // Past Bookings (for Admin / History)
  bookings: IBooking[];
  loadingBookings: boolean;
  selectedBooking: IBooking | null;

  // Actions
  setPackageId: (id: string) => void;
  setTravelDate: (date: string) => void;
  setPersons: (persons: number) => void;
  setRentalDays: (days: number) => void;
  setSelectedVehicle: (vehicle: ITransportVehicleSelection | null) => void;
  setSelectedRentalAssets: (assets: IRentalAssetSelection[]) => void;
  setCustomFeatures: (features: Partial<ICustomPlanFeatures>) => void;
  submitBooking: (bookingData: IBookingInput) => Promise<IBookingResponse>;
  fetchBookings: (params?: GetBookingsParams) => Promise<IBooking[]>;
  fetchBookingById: (id: string) => Promise<IBooking>;
  updateStatus: (id: string, statusData: { status?: BookingStatus; notes?: string; startInspection?: ITripStartInspection }) => Promise<IBooking>;
  deleteBooking: (id: string) => Promise<void>;
  sendWhatsApp: (id: string) => Promise<{ whatsappUrl: string; customerMessage: string }>;
  resetDraft: () => void;
}

export const useBookingStore = create<BookingStoreState>((set) => ({
  packageId: '',
  travelDate: '',
  persons: 2,
  rentalDays: 1,
  selectedVehicle: null,
  selectedRentalAssets: [],
  customFeatures: { foodIncluded: true, stayIncluded: true },
  submitting: false,
  error: null,
  bookings: [],
  loadingBookings: false,
  selectedBooking: null,

  setPackageId: (packageId) => set({ packageId }),
  setTravelDate: (travelDate) => set({ travelDate }),
  setPersons: (persons) => set({ persons }),
  setRentalDays: (rentalDays) => set({ rentalDays }),
  setSelectedVehicle: (selectedVehicle) => set({ selectedVehicle }),
  setSelectedRentalAssets: (selectedRentalAssets) => set({ selectedRentalAssets }),
  setCustomFeatures: (customFeatures) => set({ customFeatures }),

  submitBooking: async (bookingData: IBookingInput) => {
    try {
      set({ submitting: true, error: null });
      const res = await apiCreateBooking(bookingData);
      set({ submitting: false });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit booking';
      set({ submitting: false, error: msg });
      throw err;
    }
  },

  fetchBookings: async (params?: GetBookingsParams) => {
    try {
      set({ loadingBookings: true });
      const res = await getBookings(params);
      const data = res.bookings || [];
      set({ bookings: data, loadingBookings: false });
      return data;
    } catch (err: any) {
      set({ loadingBookings: false, error: err.message });
      throw err;
    }
  },

  fetchBookingById: async (id: string) => {
    try {
      const res = await apiGetBookingById(id);
      set({ selectedBooking: res.booking });
      return res.booking;
    } catch (err: any) {
      throw err;
    }
  },

  updateStatus: async (id, statusData) => {
    try {
      const res = await apiUpdateBookingStatus(id, statusData);
      set((state) => ({
        bookings: state.bookings.map((b) => (b._id === id || b.id === id ? res.booking : b)),
      }));
      return res.booking;
    } catch (err: any) {
      throw err;
    }
  },

  deleteBooking: async (id) => {
    try {
      await apiDeleteBooking(id);
      set((state) => ({
        bookings: state.bookings.filter((b) => b._id !== id && b.id !== id),
      }));
    } catch (err: any) {
      throw err;
    }
  },

  sendWhatsApp: async (id) => {
    const res = await apiSendCustomerWhatsApp(id);
    return { whatsappUrl: res.whatsappUrl, customerMessage: res.customerMessage };
  },

  resetDraft: () =>
    set({
      packageId: '',
      travelDate: '',
      persons: 2,
      rentalDays: 1,
      selectedVehicle: null,
      selectedRentalAssets: [],
      customFeatures: { foodIncluded: true, stayIncluded: true },
      error: null,
    }),
}));
