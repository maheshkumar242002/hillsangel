import { IPackage } from '../types';
import { mockPackages as initialPackages, mockDestinations } from '../data/mockData';

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

// In-memory / localStorage cache for packages so changes persist in session
const STORAGE_KEY = 'ha_mock_packages';

function getStoredPackages(): IPackage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }
  return [...initialPackages];
}

function savePackages(packages: IPackage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
  } catch (e) {
    // ignore
  }
}

export const getPackages = async (params: GetPackagesParams = {}): Promise<PackagesApiResponse> => {
  // Simulate minimal async delay for natural feel
  await new Promise((resolve) => setTimeout(resolve, 80));

  let list = getStoredPackages();

  // Filter inactive unless requested
  if (params.includeInactive !== 'true') {
    list = list.filter((p) => p.status !== 'inactive');
  }

  // Filter by category
  if (params.category && params.category !== 'all') {
    list = list.filter((p) => p.category.toLowerCase() === params.category?.toLowerCase());
  }

  // Filter by tier
  if (params.tier && params.tier !== 'all') {
    list = list.filter((p) => p.tier.toLowerCase() === params.tier?.toLowerCase());
  }

  // Filter by destination
  if (params.destination && params.destination !== 'all') {
    list = list.filter(
      (p) => p.destination.toLowerCase() === params.destination?.toLowerCase()
    );
  }

  // Search filter
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.destination.toLowerCase().includes(q) ||
        p.highlights.some((h) => h.toLowerCase().includes(q))
    );
  }

  // Sort
  if (params.sort) {
    if (params.sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (params.sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (params.sort === 'duration-asc') {
      list.sort((a, b) => (a.duration?.days || 0) - (b.duration?.days || 0));
    } else if (params.sort === 'featured') {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
  }

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 12;
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const paginatedPackages = list.slice(startIndex, startIndex + limit);

  return {
    success: true,
    count: paginatedPackages.length,
    total,
    totalPages,
    currentPage: page,
    packages: paginatedPackages,
  };
};

export const getPackageBySlug = async (slug: string): Promise<SinglePackageApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 80));

  const list = getStoredPackages();
  const pkg = list.find((p) => p.slug === slug);

  if (!pkg) {
    throw new Error('Package not found');
  }

  // Find counterpart (same destination & category, opposite tier)
  const oppositeTier = pkg.tier === 'premium' ? 'extra_premium' : 'premium';
  const counterpart =
    list.find(
      (p) =>
        p.destination.toLowerCase() === pkg.destination.toLowerCase() &&
        p.category === pkg.category &&
        p.tier === oppositeTier
    ) || null;

  return {
    success: true,
    package: pkg,
    counterpart,
  };
};

export const getFeaturedPackages = async (): Promise<{ success: boolean; packages: IPackage[] }> => {
  await new Promise((resolve) => setTimeout(resolve, 80));
  const list = getStoredPackages();
  const featured = list.filter((p) => p.featured && p.status !== 'inactive');
  return {
    success: true,
    packages: featured,
  };
};

export const getDestinations = async (): Promise<{
  success: boolean;
  destinations: Array<{ name: string; count: number; image?: string; minPrice?: number }>;
}> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return {
    success: true,
    destinations: mockDestinations,
  };
};

// Admin package endpoints with mock state persistence
export const createPackage = async (
  data: Partial<IPackage>
): Promise<{ success: boolean; package: IPackage; message: string }> => {
  const list = getStoredPackages();
  const newPackage: IPackage = {
    _id: `pkg-${Date.now()}`,
    id: `pkg-${Date.now()}`,
    title: data.title || 'New Tour Package',
    slug:
      data.slug ||
      (data.title || 'package').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    category: data.category || 'couple',
    tier: data.tier || 'premium',
    destination: data.destination || 'Ooty',
    duration: data.duration || { days: 3, nights: 2 },
    price: Number(data.price) || 15000,
    originalPrice: Number(data.originalPrice) || 18000,
    priceUnit: data.priceUnit || 'per couple',
    images: data.images?.length
      ? data.images
      : ['https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80'],
    highlights: data.highlights || ['Scenic hill vistas', 'Private resort stay'],
    inclusions: data.inclusions || ['Accommodation', 'Daily breakfast & dinner'],
    exclusions: data.exclusions || ['Personal expenses'],
    itinerary: data.itinerary || [],
    availableDates: data.availableDates || [],
    maxSeats: data.maxSeats || 2,
    seatsBooked: 0,
    seatsLeft: data.maxSeats || 2,
    status: data.status || 'active',
    featured: Boolean(data.featured),
  };

  list.unshift(newPackage);
  savePackages(list);

  return {
    success: true,
    package: newPackage,
    message: 'Package created successfully (demo mode)',
  };
};

export const updatePackage = async (
  id: string,
  data: Partial<IPackage>
): Promise<{ success: boolean; package: IPackage; message: string }> => {
  const list = getStoredPackages();
  const index = list.findIndex((p) => p._id === id || p.id === id);
  if (index === -1) {
    throw new Error('Package not found');
  }

  list[index] = { ...list[index], ...data };
  savePackages(list);

  return {
    success: true,
    package: list[index],
    message: 'Package updated successfully (demo mode)',
  };
};

export const deletePackage = async (id: string): Promise<{ success: boolean; message: string }> => {
  let list = getStoredPackages();
  list = list.filter((p) => p._id !== id && p.id !== id);
  savePackages(list);

  return {
    success: true,
    message: 'Package deleted successfully (demo mode)',
  };
};

export const togglePackageStatus = async (
  id: string
): Promise<{ success: boolean; message: string; package: IPackage }> => {
  const list = getStoredPackages();
  const index = list.findIndex((p) => p._id === id || p.id === id);
  if (index === -1) {
    throw new Error('Package not found');
  }

  list[index].status = list[index].status === 'active' ? 'inactive' : 'active';
  savePackages(list);

  return {
    success: true,
    message: `Package status updated to ${list[index].status}`,
    package: list[index],
  };
};

export const uploadPackageImages = async (
  formData: FormData
): Promise<{ success: boolean; message: string; urls: string[] }> => {
  return {
    success: true,
    message: 'Images uploaded successfully (demo mode)',
    urls: [
      'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    ],
  };
};
