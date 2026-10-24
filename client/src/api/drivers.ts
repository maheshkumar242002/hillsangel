import api from './axios';
import { IDriverMaster } from '../types';

export interface GetDriversParams {
  status?: string;
  search?: string;
  sort?: string;
}

export interface DriversApiResponse {
  success: boolean;
  count: number;
  data: IDriverMaster[];
}

export interface SingleDriverApiResponse {
  success: boolean;
  data: IDriverMaster;
  message?: string;
}

export const getDrivers = async (params: GetDriversParams = {}): Promise<IDriverMaster[]> => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.search) query.append('search', params.search);
  if (params.sort) query.append('sort', params.sort);

  const res = await api.get<DriversApiResponse>(`/drivers?${query.toString()}`);
  return res.data.data;
};

export const getDriverById = async (id: string | number): Promise<IDriverMaster> => {
  const res = await api.get<SingleDriverApiResponse>(`/drivers/${id}`);
  return res.data.data;
};

export const createDriver = async (data: Partial<IDriverMaster>): Promise<IDriverMaster> => {
  const res = await api.post<SingleDriverApiResponse>('/drivers', data);
  return res.data.data;
};

export const updateDriver = async (
  id: string | number,
  data: Partial<IDriverMaster>
): Promise<IDriverMaster> => {
  const res = await api.put<SingleDriverApiResponse>(`/drivers/${id}`, data);
  return res.data.data;
};

export const deleteDriver = async (id: string | number): Promise<void> => {
  await api.delete(`/drivers/${id}`);
};

export const uploadDriverPhoto = async (formData: FormData): Promise<string> => {
  const res = await api.post<{ success: boolean; url: string; message: string }>('/drivers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};
