import api from './axios';
import { IVehicleMaster } from '../types';

export interface GetVehiclesParams {
  mode?: 'tour' | 'rental';
  persons?: number;
  status?: string;
  vehicleType?: string;
}

export interface VehiclesApiResponse {
  success: boolean;
  count: number;
  data: IVehicleMaster[];
}

export interface SingleVehicleApiResponse {
  success: boolean;
  data: IVehicleMaster;
  message?: string;
}

export const getVehicles = async (params: GetVehiclesParams = {}): Promise<IVehicleMaster[]> => {
  const query = new URLSearchParams();
  if (params.mode) query.append('mode', params.mode);
  if (params.persons !== undefined && params.persons > 0) {
    query.append('persons', String(params.persons));
  }
  if (params.status) query.append('status', params.status);
  if (params.vehicleType) query.append('vehicleType', params.vehicleType);

  const res = await api.get<VehiclesApiResponse>(`/vehicles?${query.toString()}`);
  return res.data.data;
};

export const getVehicleById = async (id: string | number): Promise<IVehicleMaster> => {
  const res = await api.get<SingleVehicleApiResponse>(`/vehicles/${id}`);
  return res.data.data;
};

export const createVehicle = async (data: Partial<IVehicleMaster>): Promise<IVehicleMaster> => {
  const res = await api.post<SingleVehicleApiResponse>('/vehicles', data);
  return res.data.data;
};

export const updateVehicle = async (
  id: string | number,
  data: Partial<IVehicleMaster>
): Promise<IVehicleMaster> => {
  const res = await api.put<SingleVehicleApiResponse>(`/vehicles/${id}`, data);
  return res.data.data;
};

export const deleteVehicle = async (id: string | number): Promise<void> => {
  await api.delete(`/vehicles/${id}`);
};

export const uploadVehicleImages = async (formData: FormData): Promise<string[]> => {
  const res = await api.post<{ success: boolean; url: string; urls: string[] }>('/vehicles/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.urls || (res.data.url ? [res.data.url] : []);
};

export const startTripInspection = async (
  id: string | number,
  inspectionData: {
    startOdometerKm: number;
    fuelLevel: string;
    conditionPhotos: string[];
    driverName?: string;
    driverPhone?: string;
    customerName?: string;
    destination?: string;
    remarks?: string;
    bookingId?: string;
  }
): Promise<IVehicleMaster> => {
  const res = await api.post<SingleVehicleApiResponse>(`/vehicles/${id}/start-trip`, inspectionData);
  return res.data.data;
};

export const endTripInspection = async (
  id: string | number,
  data: {
    endOdometerKm: number;
    returnFuelLevel: string;
    returnConditionPhotos: string[];
    closingRemarks?: string;
  }
): Promise<IVehicleMaster> => {
  const res = await api.post<SingleVehicleApiResponse>(`/vehicles/${id}/end-trip`, data);
  return res.data.data;
};
