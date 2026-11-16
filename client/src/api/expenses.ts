import api from './axios';
import { IAssetExpense, IExpenseStats } from '../types';

export interface ExpensesApiResponse {
  success: boolean;
  count: number;
  expenses: IAssetExpense[];
}

export interface SingleExpenseApiResponse {
  success: boolean;
  message?: string;
  expense: IAssetExpense;
}

export interface ExpenseStatsApiResponse {
  success: boolean;
  stats: IExpenseStats;
}

export const getExpenses = async (
  params: {
    search?: string;
    entityType?: string;
    vehicleId?: string | number;
    assetId?: string | number;
    category?: string;
    paidByPartnerId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sort?: string;
  } = {}
): Promise<ExpensesApiResponse> => {
  const response = await api.get<ExpensesApiResponse>('/expenses', { params });
  return response.data;
};

export const getExpenseStats = async (): Promise<ExpenseStatsApiResponse> => {
  const response = await api.get<ExpenseStatsApiResponse>('/expenses/stats');
  return response.data;
};

export const createExpense = async (
  data: Partial<IAssetExpense>
): Promise<SingleExpenseApiResponse> => {
  const response = await api.post<SingleExpenseApiResponse>('/expenses', data);
  return response.data;
};

export const updateExpense = async (
  id: string | number,
  data: Partial<IAssetExpense>
): Promise<SingleExpenseApiResponse> => {
  const response = await api.put<SingleExpenseApiResponse>(`/expenses/${id}`, data);
  return response.data;
};

export const reimburseExpense = async (
  id: string | number,
  payload: {
    status?: 'reimbursed' | 'pending_reimbursement';
    reimbursementRef?: string;
    notes?: string;
  }
): Promise<SingleExpenseApiResponse> => {
  const response = await api.patch<SingleExpenseApiResponse>(`/expenses/${id}/reimburse`, payload);
  return response.data;
};

export const deleteExpense = async (
  id: string | number
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/expenses/${id}`);
  return response.data;
};

export const uploadReceiptImage = async (
  formData: FormData
): Promise<{ success: boolean; fileUrl?: string; message?: string }> => {
  const response = await api.post<{ success: boolean; fileUrl?: string; message?: string }>(
    '/expenses/upload-receipt',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

