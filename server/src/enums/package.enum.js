/**
 * Package Enums
 */

export const PackageStatus = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
});

export const PackageTier = Object.freeze({
  BUDGET: 'budget',
  STANDARD: 'standard',
  PREMIUM: 'premium',
  LUXURY: 'luxury',
});

export const PackageCategory = Object.freeze({
  JEEP_SAFARI: 'jeep_safari',
  TREKKING: 'trekking',
  CAMPING: 'camping',
  FAMILY_TOUR: 'family_tour',
  HONEYMOON: 'honeymoon',
});

export default {
  PackageStatus,
  PackageTier,
  PackageCategory,
};
