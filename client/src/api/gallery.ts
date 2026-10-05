import api from './axios';
import { IGalleryItem } from '../types';

export interface GalleryApiResponse {
  success: boolean;
  count: number;
  items: IGalleryItem[];
}

export interface SingleGalleryApiResponse {
  success: boolean;
  message?: string;
  item: IGalleryItem;
}

export interface UploadMediaResponse {
  success: boolean;
  fileUrl: string;
  type: 'photo' | 'video';
  originalName: string;
  message: string;
}

export const getGalleryItems = async (params: {
  type?: 'photo' | 'video' | string;
  tag?: string;
  featured?: boolean;
} = {}): Promise<GalleryApiResponse> => {
  const response = await api.get<GalleryApiResponse>('/gallery', { params });
  return response.data;
};

export const createGalleryItem = async (
  data: Partial<IGalleryItem>
): Promise<SingleGalleryApiResponse> => {
  const response = await api.post<SingleGalleryApiResponse>('/gallery', data);
  return response.data;
};

export const updateGalleryItem = async (
  id: string,
  data: Partial<IGalleryItem>
): Promise<SingleGalleryApiResponse> => {
  const response = await api.put<SingleGalleryApiResponse>(`/gallery/${id}`, data);
  return response.data;
};

export const deleteGalleryItem = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/gallery/${id}`);
  return response.data;
};

export const uploadGalleryMedia = async (formData: FormData): Promise<UploadMediaResponse> => {
  const response = await api.post<UploadMediaResponse>('/gallery/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
