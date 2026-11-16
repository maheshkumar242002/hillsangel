import api from './axios';
import { IDestination } from '../types';

export interface DestinationsApiResponse {
  success: boolean;
  count: number;
  destinations: IDestination[];
}

export interface SingleDestinationApiResponse {
  success: boolean;
  message?: string;
  destination: IDestination & {
    lodges?: any[];
    restaurants?: any[];
    packages?: any[];
  };
}

export const getDestinations = async (
  params: {
    search?: string;
    state?: string;
    status?: string;
    sort?: string;
  } = {}
): Promise<DestinationsApiResponse> => {
  const response = await api.get<DestinationsApiResponse>('/destinations', { params });
  return response.data;
};

export const getDestinationById = async (
  id: string | number
): Promise<SingleDestinationApiResponse> => {
  const response = await api.get<SingleDestinationApiResponse>(`/destinations/${id}`);
  return response.data;
};

export const createDestination = async (
  data: Partial<IDestination>
): Promise<SingleDestinationApiResponse> => {
  const response = await api.post<SingleDestinationApiResponse>('/destinations', data);
  return response.data;
};

export const updateDestination = async (
  id: string | number,
  data: Partial<IDestination>
): Promise<SingleDestinationApiResponse> => {
  const response = await api.put<SingleDestinationApiResponse>(`/destinations/${id}`, data);
  return response.data;
};

export const deleteDestination = async (
  id: string | number
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/destinations/${id}`);
  return response.data;
};

export const toggleDestinationStatus = async (
  id: string | number
): Promise<SingleDestinationApiResponse> => {
  const response = await api.patch<SingleDestinationApiResponse>(`/destinations/${id}/status`);
  return response.data;
};

export const addSubLocation = async (
  id: string | number,
  placeName: string
): Promise<{ success: boolean; message: string; subLocations: string[] }> => {
  const response = await api.post<{ success: boolean; message: string; subLocations: string[] }>(
    `/destinations/${id}/sub-locations`,
    { placeName }
  );
  return response.data;
};
