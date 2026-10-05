/**
 * TypeScript Type Definitions & Interfaces
 * for Hills Angel Tours and Travels
 */

// ==========================================
// 1. Core Category and Tier Enums / Types
// ==========================================

export type PackageCategory = 'couple' | 'stranger';

export type PackageTier = 'premium' | 'extra_premium';

export type PriceUnit = 'per couple' | 'per person';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// ==========================================
// 2. Customer Details Interface
// ==========================================

export interface ICustomerDetails {
  customerName: string;
  phone: string;
  email?: string;
  pickupLocation: string;
  specialRequests?: string;
}

// ==========================================
// 3. Package & Itinerary Interfaces
// ==========================================

export interface IItineraryDay {
  day: number;
  title: string;
  description: string;
  meals?: string;
  stay?: string;
  activities?: string[];
}

export interface IPackageDuration {
  days: number;
  nights: number;
}

export interface IPackage {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  category: PackageCategory;
  tier: PackageTier;
  destination: string;
  duration: IPackageDuration;
  price: number;
  originalPrice?: number;
  priceUnit: PriceUnit;
  images: string[];
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: IItineraryDay[];
  availableDates?: string[] | Date[];
  maxSeats?: number;
  seatsBooked?: number;
  seatsLeft?: number;
  status: 'active' | 'inactive';
  featured: boolean;
  includedAssets?: any[];
  availableVehicles?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IPackageSnapshot {
  title: string;
  slug: string;
  category: PackageCategory;
  tier: PackageTier;
  destination: string;
  price: number;
  priceUnit: PriceUnit | string;
}

export interface ITransportVehicleSelection {
  name: string;
  vehicleType: string;
  price: number;
  assetRef?: string | any;
}

export interface IRentalAssetSelection {
  asset?: string | any;
  name: string;
  rentPrice: number;
  quantity?: number;
}

// ==========================================
// 4. Booking Collection Document Interface
// ==========================================

export interface IBooking extends ICustomerDetails {
  _id?: string;
  id?: string;
  bookingId: string; // e.g. "HAT-2026-0001"
  package: string | IPackage;
  packageSnapshot: IPackageSnapshot;
  travelDate: string | Date;
  persons: number;
  transportVehicle?: ITransportVehicleSelection;
  rentalAssets?: IRentalAssetSelection[];
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
  whatsappSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// API Booking Submission Payload
export interface IBookingInput extends ICustomerDetails {
  packageId: string;
  travelDate: string;
  persons: number;
  transportVehicle?: ITransportVehicleSelection;
  rentalAssets?: IRentalAssetSelection[];
}

// API Booking Response
export interface IBookingResponse {
  success: boolean;
  message: string;
  booking: IBooking;
  whatsappUrl?: string;
  whatsappMessage?: string;
}

// ==========================================
// 5. Customer Enquiry Interface
// ==========================================

export interface IEnquiry {
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 6. Settings Interface
// ==========================================

export interface ISettings {
  _id?: string;
  siteName: string;
  tagline: string;
  whatsappNumber: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  hero?: {
    title?: string;
    subtitle?: string;
    badgeText?: string;
    bannerImage?: string;
  };
}

// ==========================================
// 7. Dedicated Collection Interfaces
// ==========================================

export interface ICustomer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
  totalBookings: number;
  totalSpent: number;
  notes?: string;
  status: 'active' | 'inactive' | 'vip';
  createdAt?: string;
  updatedAt?: string;
}

export interface ICategoryItem {
  _id: string;
  key: PackageCategory;
  name: string;
  slug: string;
  badgeText?: string;
  description: string;
  targetAudience?: string;
  icon?: string;
  highlights?: string[];
  defaultMaxSeats: number;
  defaultPriceUnit: PriceUnit;
  isActive: boolean;
}

export interface ITierItem {
  _id: string;
  key: PackageTier;
  name: string;
  slug: string;
  badgeText?: string;
  starRating: number;
  resortType?: string;
  description: string;
  badgeColor: 'elaichi' | 'gold';
  perks?: string[];
  isActive: boolean;
}

// ==========================================
// 8. Asset Module Interface
// ==========================================

export type AssetCategory = 'vehicle' | 'camping' | 'trekking' | 'electronics' | 'amenity' | 'other';
export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired';

export interface IVehicleSpecs {
  seatingCapacity?: number;
  vehicleType?: 'sedan' | 'suv' | 'jeep' | 'tempo' | 'bike' | 'other';
  ac?: boolean;
  transmission?: string;
  fuelType?: string;
}

export interface IAsset {
  _id: string;
  id?: string;
  name: string;
  assetCode: string;
  category: AssetCategory;
  buyPrice: number; // Acquisition/purchase cost in INR
  rentPrice: number; // Rental rate in INR
  rentUnit: 'per trip' | 'per day' | 'per person';
  quantity: number;
  availableQuantity: number;
  status: AssetStatus;
  imageUrl?: string;
  description?: string;
  vehicleSpecs?: IVehicleSpecs;
  createdAt?: string;
  updatedAt?: string;
}

export interface IAssetStats {
  totalAssets: number;
  availableAssets: number;
  inUseAssets: number;
  maintenanceAssets: number;
  totalBuyInvestment: number;
  totalRentYieldPotential: number;
  categoryStats: Array<{
    _id: AssetCategory;
    count: number;
    totalUnits: number;
    totalBuyValue: number;
  }>;
}

// ==========================================
// 9. Gallery Module Interface (Photos & Videos)
// ==========================================

export interface IGalleryItem {
  _id: string;
  id?: string;
  title: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  tag: string;
  caption?: string;
  featured?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}


