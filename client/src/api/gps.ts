import api from './axios';
import { IGpsApiResponse, IVehicleGps } from '../types';

export const getTrackedVehicles = async (): Promise<IGpsApiResponse> => {
  const response = await api.get<IGpsApiResponse>('/gps/vehicles');
  return response.data;
};

export const getVehicleGpsById = async (
  id: string | number
): Promise<{ success: boolean; vehicle: IVehicleGps }> => {
  const response = await api.get<{ success: boolean; vehicle: IVehicleGps }>(`/gps/vehicles/${id}`);
  return response.data;
};

export const simulateGpsStep = async (): Promise<{
  success: boolean;
  message: string;
  vehicles: IVehicleGps[];
}> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    vehicles: IVehicleGps[];
  }>('/gps/simulate-step');
  return response.data;
};

export const resetVehiclesGps = async (): Promise<{
  success: boolean;
  message: string;
  vehicles: IVehicleGps[];
}> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    vehicles: IVehicleGps[];
  }>('/gps/reset');
  return response.data;
};

export const updateVehicleTelemetry = async (
  data: Partial<IVehicleGps>
): Promise<{ success: boolean; message: string; vehicle: IVehicleGps }> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    vehicle: IVehicleGps;
  }>('/gps/update', data);
  return response.data;
};
