import { IGalleryItem } from '../types';
import { mockGalleryItems } from '../data/mockData';

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

const STORAGE_KEY = 'ha_mock_gallery';

function getStoredGallery(): IGalleryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return [...mockGalleryItems];
}

function saveGallery(list: IGalleryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

export const getGalleryItems = async (
  params: {
    type?: 'photo' | 'video' | string;
    tag?: string;
    featured?: boolean;
  } = {}
): Promise<GalleryApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 80));

  let items = getStoredGallery();

  if (params.type && params.type !== 'all') {
    items = items.filter((i) => i.type === params.type);
  }

  if (params.tag && params.tag !== 'all') {
    items = items.filter((i) => i.tag?.toLowerCase() === params.tag?.toLowerCase());
  }

  if (params.featured !== undefined) {
    items = items.filter((i) => Boolean(i.featured) === params.featured);
  }

  return {
    success: true,
    count: items.length,
    items,
  };
};

export const createGalleryItem = async (
  data: Partial<IGalleryItem>
): Promise<SingleGalleryApiResponse> => {
  const items = getStoredGallery();
  const newItem: IGalleryItem = {
    _id: `gal-${Date.now()}`,
    title: data.title || 'Mountain View',
    type: data.type || 'photo',
    url: data.url || 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
    caption: data.caption || '',
    tag: data.tag || 'Ooty',
    featured: Boolean(data.featured),
  };

  items.unshift(newItem);
  saveGallery(items);

  return {
    success: true,
    message: 'Media added to gallery',
    item: newItem,
  };
};

export const updateGalleryItem = async (
  id: string,
  data: Partial<IGalleryItem>
): Promise<SingleGalleryApiResponse> => {
  const items = getStoredGallery();
  const index = items.findIndex((i) => i._id === id);
  if (index === -1) throw new Error('Item not found');

  items[index] = { ...items[index], ...data };
  saveGallery(items);

  return {
    success: true,
    message: 'Gallery item updated',
    item: items[index],
  };
};

export const deleteGalleryItem = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  let items = getStoredGallery();
  items = items.filter((i) => i._id !== id);
  saveGallery(items);
  return {
    success: true,
    message: 'Gallery item removed',
  };
};

export const uploadGalleryMedia = async (formData: FormData): Promise<UploadMediaResponse> => {
  return {
    success: true,
    fileUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
    type: 'photo',
    originalName: 'upload.jpg',
    message: 'Media uploaded successfully (demo mode)',
  };
};
