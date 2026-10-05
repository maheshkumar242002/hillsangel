import { IAsset, IAssetStats } from '../types';
import { mockAssets } from '../data/mockData';

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

const STORAGE_KEY = 'ha_mock_assets';

function getStoredAssets(): IAsset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return [...mockAssets];
}

function saveAssets(list: IAsset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

export const getAssets = async (
  params: {
    category?: string;
    status?: string;
    search?: string;
    sort?: string;
  } = {}
): Promise<AssetsApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 80));

  let list = getStoredAssets();

  if (params.category && params.category !== 'all') {
    list = list.filter((a) => a.category === params.category);
  }

  if (params.status && params.status !== 'all') {
    list = list.filter((a) => a.status === params.status);
  }

  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.assetCode?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
    );
  }

  return {
    success: true,
    count: list.length,
    assets: list,
  };
};

export const getAssetStats = async (): Promise<AssetStatsResponse> => {
  const list = getStoredAssets();
  const totalAssets = list.length;
  const availableAssets = list.filter((a) => a.status === 'available').length;
  const inUseAssets = list.filter((a) => a.status === 'in_use').length;
  const maintenanceAssets = list.filter((a) => a.status === 'maintenance').length;
  const totalBuyInvestment = list.reduce((sum, a) => sum + (a.buyPrice || 0) * (a.quantity || 1), 0);
  const totalRentYieldPotential = list.reduce((sum, a) => sum + (a.rentPrice || 0) * (a.quantity || 1), 0);

  const categoryCounts = list.reduce((acc: Record<string, { count: number; totalUnits: number; totalBuyValue: number }>, a) => {
    if (!acc[a.category]) {
      acc[a.category] = { count: 0, totalUnits: 0, totalBuyValue: 0 };
    }
    acc[a.category].count += 1;
    acc[a.category].totalUnits += a.quantity || 1;
    acc[a.category].totalBuyValue += (a.buyPrice || 0) * (a.quantity || 1);
    return acc;
  }, {});

  const categoryStats = Object.entries(categoryCounts).map(([cat, data]) => ({
    _id: cat as any,
    count: data.count,
    totalUnits: data.totalUnits,
    totalBuyValue: data.totalBuyValue,
  }));

  return {
    success: true,
    stats: {
      totalAssets,
      availableAssets,
      inUseAssets,
      maintenanceAssets,
      totalBuyInvestment,
      totalRentYieldPotential,
      categoryStats,
    },
  };
};

export const getAssetById = async (id: string): Promise<SingleAssetApiResponse> => {
  const list = getStoredAssets();
  const asset = list.find((a) => a._id === id || a.id === id);
  if (!asset) throw new Error('Asset not found');
  return { success: true, asset };
};

export const createAsset = async (data: Partial<IAsset>): Promise<SingleAssetApiResponse> => {
  const list = getStoredAssets();
  const newAsset: IAsset = {
    _id: `ast-${Date.now()}`,
    id: `ast-${Date.now()}`,
    name: data.name || 'New Equipment',
    assetCode: data.assetCode || `AST-${Date.now().toString().slice(-4)}`,
    category: data.category || 'vehicle',
    buyPrice: Number(data.buyPrice) || 50000,
    rentPrice: Number(data.rentPrice) || 1000,
    rentUnit: data.rentUnit || 'per trip',
    quantity: Number(data.quantity) || 1,
    availableQuantity: Number(data.availableQuantity) || 1,
    status: data.status || 'available',
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    description: data.description || '',
    vehicleSpecs: data.vehicleSpecs,
  };

  list.unshift(newAsset);
  saveAssets(list);

  return {
    success: true,
    message: 'Asset added successfully',
    asset: newAsset,
  };
};

export const updateAsset = async (
  id: string,
  data: Partial<IAsset>
): Promise<SingleAssetApiResponse> => {
  const list = getStoredAssets();
  const index = list.findIndex((a) => a._id === id || a.id === id);
  if (index === -1) throw new Error('Asset not found');

  list[index] = { ...list[index], ...data };
  saveAssets(list);

  return {
    success: true,
    message: 'Asset updated successfully',
    asset: list[index],
  };
};

export const deleteAsset = async (id: string): Promise<{ success: boolean; message: string }> => {
  let list = getStoredAssets();
  list = list.filter((a) => a._id !== id && a.id !== id);
  saveAssets(list);
  return {
    success: true,
    message: 'Asset deleted successfully',
  };
};

export const uploadAssetImage = async (
  formData: FormData
): Promise<{ success: boolean; fileUrl: string; message: string }> => {
  return {
    success: true,
    fileUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    message: 'Asset image uploaded successfully',
  };
};
