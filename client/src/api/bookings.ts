import api from './axios';
import { IBooking, IBookingInput, IBookingResponse, BookingStatus } from '../types';

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

// Public booking creation
export const createBooking = async (bookingData: IBookingInput): Promise<IBookingResponse> => {
  const response = await api.post<IBookingResponse>('/bookings', bookingData);
  return response.data;
};

// Admin booking endpoints
export const getBookings = async (params: GetBookingsParams = {}): Promise<BookingsApiResponse> => {
  const response = await api.get<BookingsApiResponse>('/bookings', { params });
  return response.data;
};

export const getBookingById = async (id: string): Promise<{ success: boolean; booking: IBooking }> => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const updateBookingStatus = async (
  id: string,
  statusData: { status?: BookingStatus; notes?: string }
): Promise<{ success: boolean; message: string; booking: IBooking }> => {
  const response = await api.patch(`/bookings/${id}/status`, statusData);
  return response.data;
};

export const deleteBooking = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};

export const sendCustomerWhatsApp = async (
  id: string
): Promise<{ success: boolean; message: string; whatsappUrl: string; customerMessage: string }> => {
  const response = await api.post(`/bookings/${id}/send-whatsapp`);
  return response.data;
};

export const getExportBookingsCsvUrl = (): string => {
  const baseURL = import.meta.env.VITE_API_URL || '/api';
  return `${baseURL}/bookings/export/csv`;
};
