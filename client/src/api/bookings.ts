import api from './axios';
import { IBooking, IBookingInput, IBookingResponse, BookingStatus, ITripStartInspection } from '../types';

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

export const createBooking = async (bookingData: IBookingInput): Promise<IBookingResponse> => {
  const response = await api.post<IBookingResponse>('/bookings', bookingData);
  return response.data;
};

export const getBookings = async (params: GetBookingsParams = {}): Promise<BookingsApiResponse> => {
  const response = await api.get<BookingsApiResponse>('/bookings', { params });
  return response.data;
};

export const getBookingById = async (id: string): Promise<{ success: boolean; booking: IBooking }> => {
  const response = await api.get<{ success: boolean; booking: IBooking }>(`/bookings/${id}`);
  return response.data;
};

export const updateBookingStatus = async (
  id: string,
  statusData: { status?: BookingStatus; notes?: string; startInspection?: ITripStartInspection }
): Promise<{ success: boolean; message: string; booking: IBooking; settlement?: any }> => {
  const response = await api.patch<{ success: boolean; message: string; booking: IBooking; settlement?: any }>(
    `/bookings/${id}/status`,
    statusData
  );
  return response.data;
};

export const deleteBooking = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/bookings/${id}`);
  return response.data;
};

export const sendCustomerWhatsApp = async (
  id: string
): Promise<{ success: boolean; message: string; whatsappUrl: string; customerMessage: string }> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    whatsappUrl: string;
    customerMessage: string;
  }>(`/bookings/${id}/send-whatsapp`);
  return response.data;
};

export const getExportBookingsCsvUrl = (): string => {
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${base}/bookings/export/csv`;
};
