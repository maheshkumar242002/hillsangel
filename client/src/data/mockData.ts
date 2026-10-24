/**
 * ------------------------------------------------------------------
 * HILLS ANGELS TOURS & TRAVELS - 100% DATABASE DRIVEN
 * ------------------------------------------------------------------
 * STRICT ARCHITECTURE RULE: NO MOCK DATA.
 *
 * All application records are strictly loaded from MySQL/Sequelize DB
 * via authenticated and public REST API endpoints:
 *
 * - Tour Packages & Tiers:       GET /api/packages
 * - Vehicle Fleet Master:        GET /api/vehicles (RC Book, Insurance, Mileage)
 * - Hotel & Food Partners:       GET /api/partners (Commission & Settle)
 * - Camping Gear & Assets:       GET /api/assets
 * - Live Fleet GPS Telemetry:    GET /api/gps
 * - Bookings & Customer Records: GET /api/bookings
 * - Gallery & Media:             GET /api/gallery
 * - Master Settings:             GET /api/settings
 * ------------------------------------------------------------------
 */

import { IPackage, IAsset, IGalleryItem, ISettings, IBooking } from '../types';

export const mockPackages: IPackage[] = [];
export const mockDestinations: string[] = [];
export const mockAssets: IAsset[] = [];
export const mockGalleryItems: IGalleryItem[] = [];
export const mockSettings: Partial<ISettings> = {};
export const initialMockBookings: IBooking[] = [];
