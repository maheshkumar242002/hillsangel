import api from './axios';
import { IAsset, IAssetStats } from '../types';

export interface AssetsApiResponse {
  success: boolean;
  count: number;
  assets: IAsset[];
}

export interface SingleAssetApiResponse {
  success: boolean;
  message?: string;
  asset: IAsset;
}

export interface AssetStatsResponse {
  success: boolean;
  stats: IAssetStats;
}

export const getAssets = async (params: {
  category?: string;
  status?: string;
  search?: string;
  sort?: string;
} = {}): Promise<AssetsApiResponse> => {
  const response = await api.get<AssetsApiResponse>('/assets', { params });
  return response.data;
};

export const getAssetStats = async (): Promise<AssetStatsResponse> => {
  const response = await api.get<AssetStatsResponse>('/assets/stats');
  return response.data;
};

export const getAssetById = async (id: string): Promise<SingleAssetApiResponse> => {
  const response = await api.get<SingleAssetApiResponse>(`/assets/${id}`);
  return response.data;
};

export const createAsset = async (data: Partial<IAsset>): Promise<SingleAssetApiResponse> => {
  const response = await api.post<SingleAssetApiResponse>('/assets', data);
  return response.data;
};

export const updateAsset = async (id: string, data: Partial<IAsset>): Promise<SingleAssetApiResponse> => {
  const response = await api.put<SingleAssetApiResponse>(`/assets/${id}`, data);
  return response.data;
};

export const deleteAsset = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/assets/${id}`);
  return response.data;
};

export const uploadAssetImage = async (
  formData: FormData
): Promise<{ success: boolean; fileUrl: string; message: string }> => {
  const response = await api.post<{ success: boolean; fileUrl: string; message: string }>(
    '/assets/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
};
