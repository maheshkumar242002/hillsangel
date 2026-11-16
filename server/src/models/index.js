import Admin from './Admin.js';
import Category from './Category.js';
import Tier from './Tier.js';
import Asset from './Asset.js';
import Package from './Package.js';
import Customer from './Customer.js';
import Booking from './Booking.js';
import Enquiry from './Enquiry.js';
import Gallery from './Gallery.js';
import Settings from './Settings.js';
import VehicleGps from './VehicleGps.js';

import PartnerTieup from './PartnerTieup.js';
import TripSettlement from './TripSettlement.js';
import Vehicle from './Vehicle.js';
import Driver from './Driver.js';
import Destination from './Destination.js';
import AssetExpense from './AssetExpense.js';

// Define Associations
Package.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoryDetails' });
Category.hasMany(Package, { foreignKey: 'categoryId', as: 'packages' });

Package.belongsTo(Tier, { foreignKey: 'tierId', as: 'tierDetails' });
Tier.hasMany(Package, { foreignKey: 'tierId', as: 'packages' });

Booking.belongsTo(Customer, { foreignKey: 'customerId', as: 'customerDetails' });
Customer.hasMany(Booking, { foreignKey: 'customerId', as: 'bookings' });

Booking.belongsTo(Package, { foreignKey: 'packageId', as: 'packageDetails' });
Booking.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoryDetails' });
Booking.belongsTo(Tier, { foreignKey: 'tierId', as: 'tierDetails' });

AssetExpense.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicleDetails' });
Vehicle.hasMany(AssetExpense, { foreignKey: 'vehicleId', as: 'expenses' });

AssetExpense.belongsTo(Asset, { foreignKey: 'assetId', as: 'assetDetails' });
Asset.hasMany(AssetExpense, { foreignKey: 'assetId', as: 'expenses' });

export {
  Admin,
  Category,
  Tier,
  Asset,
  Package,
  Customer,
  Booking,
  Enquiry,
  Gallery,
  Settings,
  VehicleGps,
  PartnerTieup,
  TripSettlement,
  Vehicle,
  Driver,
  Destination,
  AssetExpense,
};
