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
  const response = await api.get<SinglePackageApiResponse>(`/packages/${encodeURIComponent(slug)}`);
  return response.data;
};

export const getFeaturedPackages = async (): Promise<{ success: boolean; packages: IPackage[] }> => {
  const response = await api.get<{ success: boolean; packages: IPackage[] }>('/packages/featured');
  return response.data;
};

export const getDestinations = async (): Promise<{
  success: boolean;
  destinations: Array<{ name: string; count: number; image?: string; minPrice?: number }>;
}> => {
  const response = await api.get<{
    success: boolean;
    destinations: Array<{ name: string; count: number; image?: string; minPrice?: number }>;
  }>('/packages/destinations');
  return response.data;
};

export const createPackage = async (
  data: Partial<IPackage>
): Promise<{ success: boolean; package: IPackage; message: string }> => {
  const response = await api.post<{ success: boolean; package: IPackage; message: string }>(
    '/packages',
    data
  );
  return response.data;
};

export const updatePackage = async (
  id: string,
  data: Partial<IPackage>
): Promise<{ success: boolean; package: IPackage; message: string }> => {
  const response = await api.put<{ success: boolean; package: IPackage; message: string }>(
    `/packages/${id}`,
    data
  );
  return response.data;
};

export const deletePackage = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/packages/${id}`);
  return response.data;
};

export const togglePackageStatus = async (
  id: string
): Promise<{ success: boolean; message: string; package: IPackage }> => {
  const response = await api.patch<{ success: boolean; message: string; package: IPackage }>(
    `/packages/${id}/status`
  );
  return response.data;
};

export const uploadPackageImages = async (
  formData: FormData
): Promise<{ success: boolean; message: string; urls: string[] }> => {
  const response = await api.post<{ success: boolean; message: string; urls: string[] }>(
    '/packages/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};
