/**
 * TypeScript Type Definitions & Interfaces
 * for Hills Angel Tours and Travels
 */

// ==========================================
// 1. Core Category and Tier Enums / Types
// ==========================================

export type PackageCategory = 'family' | 'friends' | 'couple' | 'stranger';

export type PackageTier = 'premium' | 'extra_premium';

export type PriceUnit = 'per jeep' | 'per family' | 'per group' | 'per person' | 'per couple';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'cancelled' | 'completed';

export interface ITripStartInspectionPhotos {
  front?: string;
  rear?: string;
  leftSide?: string;
  rightSide?: string;
  odometer?: string;
  interior?: string;
  additional?: string[];
}

export interface ITripStartInspection {
  vehicleId?: number | string;
  vehicleReg?: string;
  vehicleName?: string;
  driverId?: number | string;
  driverName?: string;
  driverPhone?: string;
  odometerKm?: number | string;
  fuelLevel?: string;
  photos: ITripStartInspectionPhotos;
  safetyChecklist?: {
    spareTyre?: boolean;
    toolkitJack?: boolean;
    firstAidKit?: boolean;
    cleanInterior?: boolean;
    fuelAdequate?: boolean;
    lightsBrakesWorking?: boolean;
  };
  remarks?: string;
  inspectedAt?: string;
}

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
  duration?: IPackageDuration;
  price: number;
  priceUnit: PriceUnit | string;
}

export interface ITransportVehicleSelection {
  name: string;
  vehicleType: string;
  price: number;
  seatingCapacity?: number;
  assetRef?: string | any;
  regNumber?: string;
  badge?: string;
  categoryLabel?: string;
  description?: string;
}

export interface IVehicleMaster {
  _id?: string;
  id?: number | string;
  name: string;
  regNumber: string;
  vehicleType: 'jeep' | 'sedan' | 'suv' | 'van' | 'bus' | 'self' | string;
  seatingCapacity: number;
  pricePerDay: number;
  tourAddonPrice: number;
  categoryLabel?: string;
  badge?: string;
  description?: string;
  features?: string[];
  imageUrl?: string;
  images?: string[];

  // RC Book Details
  rcNumber?: string;
  rcOwnerName?: string;
  registrationDate?: string;
  fcExpiryDate?: string;
  chassisNumber?: string;
  engineNumber?: string;

  // Insurance Details
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  insuranceType?: string;

  // Pollution & Permit
  pollutionCertNumber?: string;
  pollutionExpiryDate?: string;
  permitType?: string;
  permitExpiryDate?: string;

  // Mileage & Maintenance
  currentOdometerKm?: number;
  mileageKmpl?: number;
  fuelType?: 'Diesel' | 'Petrol' | 'Electric' | 'Hybrid' | 'CNG' | string;
  lastServiceDate?: string;
  nextServiceDueKm?: number;

  // Driver
  driverName?: string;
  driverPhone?: string;
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;

  // Status
  status: 'available' | 'on_tour' | 'maintenance' | 'inactive';
  isAvailableForRental: boolean;
  isAvailableForTour: boolean;
  sortOrder?: number;
  currentTrip?: ITripInspectionRecord | null;
  tripInspectionHistory?: ITripInspectionRecord[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ITripInspectionRecord {
  tripId: string;
  bookingId?: string;
  customerName: string;
  destination: string;
  driverName: string;
  driverPhone: string;
  startOdometerKm: number;
  endOdometerKm?: number;
  kmRun?: number;
  fuelLevel: string;
  returnFuelLevel?: string;
  conditionPhotos: string[];
  returnConditionPhotos?: string[];
  remarks: string;
  closingRemarks?: string;
  startedAt: string;
  endedAt?: string;
  returnedAt?: string;
  status: 'active' | 'completed';
}

export interface IDriverMaster {
  _id?: string;
  id?: number | string;
  name: string;
  phone: string;
  altPhone?: string;
  photoUrl?: string;
  licenseNumber: string;
  licenseExpiry?: string;
  badgeNumber?: string;
  experienceYears: number;
  specialization: string;
  languages: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  address?: string;
  assignedVehicleId?: number | null;
  assignedVehicleReg?: string;
  dailyBatta: number;
  rating: number;
  totalTripsCompleted: number;
  status: 'available' | 'on_tour' | 'on_leave' | 'inactive';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IRentalAssetSelection {
  asset?: string | any;
  name: string;
  rentPrice: number;
  quantity?: number;
}

export type BookingType = 'tour_package' | 'vehicle_rental_with_driver';

export interface ICustomPlanFeatures {
  foodIncluded: boolean; // Food venum / vena
  stayIncluded: boolean; // Stay venum / vena
  campfireIncluded?: boolean;
  photographyIncluded?: boolean;
  driverBataIncluded?: boolean;
  rentalDays?: number;
  openDestination?: boolean;
  destinationDetails?: string;
}

// ==========================================
// 4. Booking Collection Document Interface
// ==========================================

export interface IBooking extends ICustomerDetails {
  _id?: string;
  id?: string;
  bookingId: string; // e.g. "HAT-2026-0001"
  bookingType?: BookingType;
  package: string | IPackage;
  packageSnapshot: IPackageSnapshot;
  travelDate: string | Date;
  persons: number;
  transportVehicle?: ITransportVehicleSelection;
  rentalAssets?: IRentalAssetSelection[];
  customFeatures?: ICustomPlanFeatures;
  totalPrice: number;
  status: BookingStatus;
  startInspection?: ITripStartInspection;
  notes?: string;
  whatsappSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// API Booking Submission Payload
export interface IBookingInput extends ICustomerDetails {
  packageId: string;
  bookingType?: BookingType;
  travelDate: string;
  persons: number;
  transportVehicle?: ITransportVehicleSelection;
  rentalAssets?: IRentalAssetSelection[];
  customFeatures?: ICustomPlanFeatures;
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
  organizerPartners?: IOrganizerPartnersSettings;
  tripExpenseDefaults?: ITripExpenseDefaults;
}

export interface ITripExpenseDefaults {
  stayRatePerPersonNight: number;
  foodRatePerPersonDay: number;
  transportRatePerDay: number;
  driverBataPerTrip: number;
  miscRatePerTrip: number;
  autoSettleOnStatus?: 'confirmed' | 'completed' | 'both';
}

export interface IOrganizerPartnerConfig {
  id?: string;
  name: string;
  phone?: string;
  sharePercent: number;
  upiId?: string;
  role?: string;
}

export interface IOrganizerPartnersSettings {
  enabled?: boolean;
  splitMode?: 'percentage' | 'fixed';
  partners: IOrganizerPartnerConfig[];
  partner1?: IOrganizerPartnerConfig;
  partner2?: IOrganizerPartnerConfig;
  notes?: string;
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

// ==========================================
// 10. Live Vehicle GPS Fleet Interfaces
// ==========================================

export interface IGpsRoutePoint {
  lat: number;
  lng: number;
  speed: number;
  time?: string;
  timestamp?: string;
}

export interface IVehicleGps {
  _id: string;
  id?: number | string;
  vehicleName: string;
  regNumber: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  status: 'on_tour' | 'idle' | 'returning' | 'stopped' | 'maintenance';
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude: number;
  ignition: boolean;
  batteryLevel: number;
  currentLocationName: string;
  assignedTour: string;
  tripType?: 'vehicle_rental_with_driver' | 'tour_package' | 'depot_standby';
  customerName?: string;
  customerPhone?: string;
  destination?: string;
  planCustomizations?: string;
  passengersCount: number;
  deviceId?: string;
  routeHistory?: IGpsRoutePoint[];
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IGpsFleetSummary {
  totalVehicles: number;
  onTourCount: number;
  idleCount: number;
  stoppedCount: number;
  movingCount: number;
  officeBaseCoordinates: {
    lat: number;
    lng: number;
    label: string;
    mapUrl: string;
  };
}

export interface IGpsApiResponse {
  success: boolean;
  count: number;
  summary: IGpsFleetSummary;
  vehicles: IVehicleGps[];
}

// ==========================================
// 10. Partner & Vendor Tie-up Interfaces (Cottages, Hotels, Food)
// ==========================================

export type PartnerCategory = 'stay' | 'food';

export type PartnerType =
  | 'cottage'
  | 'hotel'
  | 'resort'
  | 'homestay'
  | 'restaurant'
  | 'cafe'
  | 'mess'
  | 'other';

export type PricingModel = 'per_person' | 'per_trip' | 'per_room' | 'per_meal';

export type FoodType = 'all' | 'veg' | 'non_veg' | 'buffet';

export interface IMealPricing {
  breakfast?: number;
  lunch?: number;
  dinner?: number;
  fullDay?: number;
}

export interface IPartnerTieup {
  _id?: string;
  id?: string | number;
  name: string;
  partnerCode: string;
  category: PartnerCategory;
  type: PartnerType;
  location: string;
  address?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  pricingModel: PricingModel;
  pricePerPerson: number;
  pricePerTrip: number;
  pricePerRoom: number;
  mealPricing?: IMealPricing;
  capacity: number;
  maxGuestsPerRoom: number;
  foodType: FoodType;
  amenities: string[];
  paymentTerms?: string;
  rating?: number;
  status: 'active' | 'inactive';
  imageUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPartnerStats {
  totalCount: number;
  stayCount: number;
  foodCount: number;
  activeCount: number;
  avgStayPerPerson: number;
  avgStayPerRoom: number;
  avgStayPerTrip: number;
  avgFoodPerPerson: number;
  avgFoodPerTrip: number;
  locations: string[];
}

export interface ISettlementItem {
  id: number | string;
  name: string;
  type: string;
  pricingModel: string;
  rateUsed: number;
  totalCost: number;
  costPerPerson: number;
  mealSelectionSummary?: string;
}

export interface IPartnerCommissionDetail {
  id?: string;
  name: string;
  phone?: string;
  sharePercent: number;
  amount: number;
}

export interface IPartnerSplitResult {
  tripRevenue: number;
  transportCost: number;
  miscCost: number;
  totalVendorPayout: number;
  totalTripExpenses: number;
  netOrganizingProfit: number;
  profitMarginPercent: number;
  partners: IPartnerCommissionDetail[];
  partner1?: IPartnerCommissionDetail;
  partner2?: IPartnerCommissionDetail;
}

export interface ISettlementCalculation {
  persons: number;
  nights: number;
  days: number;
  stay: ISettlementItem | null;
  food: ISettlementItem | null;
  totalSettlement: number;
  totalPerPerson: number;
  partnerSplit?: IPartnerSplitResult;
}

export interface IPartnerPayoutItem {
  id?: string;
  name: string;
  phone?: string;
  sharePercent: number;
  amount: number;
  status: 'paid' | 'pending';
  paymentMode?: 'upi' | 'gpay' | 'cash' | 'bank' | string;
  paymentRef?: string;
  paidAt?: string | null;
  notes?: string;
}

export interface ITripSettlement {
  id: number;
  settlementCode: string;
  bookingId?: string;
  tripTitle: string;
  destination: string;
  tripDate: string;
  numPersons: number;
  numNights: number;
  numDays: number;
  tripRevenue: number;
  stayCost: number;
  stayPartnerName?: string;
  foodCost: number;
  foodPartnerName?: string;
  transportCost: number;
  miscCost: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
  partnersBreakdown: IPartnerPayoutItem[];
  overallStatus: 'settled' | 'partial' | 'pending';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPartnerCommissionSummary {
  name: string;
  phone?: string;
  tripsCount: number;
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
  lastTripDate?: string;
  lastSettlementCode?: string;
}

export interface ICommissionStats {
  totalTrips: number;
  totalRevenue: number;
  totalExpenses: number;
  totalNetProfit: number;
  totalCommissionDistributed: number;
  totalPaidCommission: number;
  totalPendingCommission: number;
  partnerSummary: IPartnerCommissionSummary[];
}


