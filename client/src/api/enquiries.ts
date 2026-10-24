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
  const response = await api.post<{ success: boolean; message: string; enquiryId: string; _id?: string }>(
    '/enquiries',
    enquiryData
  );
  return {
    success: true,
    message: response.data?.message || 'Thank you! Your enquiry has been received.',
    enquiryId: String(response.data?.enquiryId || response.data?._id || ''),
  };
};

export const getEnquiries = async (
  params: { status?: string; page?: number; limit?: number } = {}
): Promise<EnquiriesApiResponse> => {
  const response = await api.get<EnquiriesApiResponse>('/enquiries', { params });
  return response.data;
};

export const updateEnquiryStatus = async (
  id: string,
  status: 'unread' | 'read' | 'replied'
): Promise<{ success: boolean; message: string; enquiry: IEnquiry }> => {
  const response = await api.patch<{ success: boolean; message: string; enquiry: IEnquiry }>(
    `/enquiries/${id}/status`,
    { status }
  );
  return response.data;
};

export const deleteEnquiry = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/enquiries/${id}`);
  return response.data;
};

export const getEnquiryWhatsAppLink = async (
  id: string
): Promise<{ success: boolean; whatsappUrl: string }> => {
  const response = await api.get<{ success: boolean; whatsappUrl: string }>(
    `/enquiries/${id}/whatsapp-link`
  );
  return response.data;
};
