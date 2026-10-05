import api from './axios';
import { IEnquiry } from '../types';

export interface CreateEnquiryInput {
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
}

export interface EnquiriesApiResponse {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  enquiries: IEnquiry[];
}

export const createEnquiry = async (
  enquiryData: CreateEnquiryInput
): Promise<{ success: boolean; message: string; enquiryId: string }> => {
  const response = await api.post('/enquiries', enquiryData);
  return response.data;
};

export const getEnquiries = async (params: { status?: string; page?: number; limit?: number } = {}): Promise<EnquiriesApiResponse> => {
  const response = await api.get<EnquiriesApiResponse>('/enquiries', { params });
  return response.data;
};

export const updateEnquiryStatus = async (
  id: string,
  status: 'unread' | 'read' | 'replied'
): Promise<{ success: boolean; message: string; enquiry: IEnquiry }> => {
  const response = await api.patch(`/enquiries/${id}/status`, { status });
  return response.data;
};

export const deleteEnquiry = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/enquiries/${id}`);
  return response.data;
};

export const getEnquiryWhatsAppLink = async (id: string): Promise<{ success: boolean; whatsappUrl: string }> => {
  const response = await api.get(`/enquiries/${id}/whatsapp-link`);
  return response.data;
};
