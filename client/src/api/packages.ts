import api from './axios';
import { IPackage } from '../types';

export interface GetPackagesParams {
  category?: string;
  tier?: string;
  destination?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  includeInactive?: string;
}

export interface PackagesApiResponse {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  packages: IPackage[];
}

export interface SinglePackageApiResponse {
  success: boolean;
  package: IPackage;
  counterpart?: IPackage | null;
}

export const getPackages = async (params: GetPackagesParams = {}): Promise<PackagesApiResponse> => {
  const response = await api.get<PackagesApiResponse>('/packages', { params });
  return response.data;
};

export const getPackageBySlug = async (slug: string): Promise<SinglePackageApiResponse> => {
  const response = await api.get<SinglePackageApiResponse>(`/packages/${slug}`);
  return response.data;
};

export const getFeaturedPackages = async (): Promise<{ success: boolean; packages: IPackage[] }> => {
  const response = await api.get('/packages/featured');
  return response.data;
};

export const getDestinations = async (): Promise<{
  success: boolean;
  destinations: Array<{ name: string; count: number; image?: string; minPrice?: number }>;
}> => {
  const response = await api.get('/packages/destinations');
  return response.data;
};

// Admin package endpoints
export const createPackage = async (data: Partial<IPackage>): Promise<{ success: boolean; package: IPackage; message: string }> => {
  const response = await api.post('/packages', data);
  return response.data;
};

export const updatePackage = async (id: string, data: Partial<IPackage>): Promise<{ success: boolean; package: IPackage; message: string }> => {
  const response = await api.put(`/packages/${id}`, data);
  return response.data;
};

export const deletePackage = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/packages/${id}`);
  return response.data;
};

export const togglePackageStatus = async (id: string): Promise<{ success: boolean; message: string; package: IPackage }> => {
  const response = await api.patch(`/packages/${id}/status`);
  return response.data;
};

export const uploadPackageImages = async (formData: FormData): Promise<{ success: boolean; message: string; urls: string[] }> => {
  const response = await api.post('/packages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
