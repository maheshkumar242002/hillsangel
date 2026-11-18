import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Vehicle extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    const jsonFields = ['features', 'images', 'currentTrip', 'tripInspectionHistory'];
    jsonFields.forEach((field) => {
      if (typeof values[field] === 'string') {
        try {
          values[field] = JSON.parse(values[field]);
        } catch (e) {
          values[field] = field === 'currentTrip' ? null : [];
        }
      }
    });
    return values;
  }
}

Vehicle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    regNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    vehicleType: {
      type: DataTypes.ENUM('jeep', 'sedan', 'suv', 'van', 'bus', 'self'),
      defaultValue: 'jeep',
      allowNull: false,
    },
    seatingCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
    },
    pricePerDay: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 3200.0,
    },
    tourAddonPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    categoryLabel: {
      type: DataTypes.STRING,
      defaultValue: 'Safari Ride',
    },
    badge: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    imageUrl: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
    },

    // --- Active Trip & Vehicle Condition Inspections ---
    currentTrip: {
      type: DataTypes.JSON,
      defaultValue: null,
    },
    tripInspectionHistory: {
      type: DataTypes.JSON,
      defaultValue: [],
    },

    // --- RC Book Master Details ---
    rcNumber: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    rcOwnerName: {
      type: DataTypes.STRING,
      defaultValue: 'Hills Angels Safaris & Eco Tours',
    },
    registrationDate: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    fcExpiryDate: {
      type: DataTypes.STRING, // Fitness Certificate Expiry
      defaultValue: '',
    },
    chassisNumber: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    engineNumber: {
      type: DataTypes.STRING,
      defaultValue: '',
    },

    // --- Insurance Master Details ---
    insuranceCompany: {
      type: DataTypes.STRING,
      defaultValue: 'United India Insurance Co. Ltd',
    },
    insurancePolicyNumber: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    insuranceExpiryDate: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    insuranceType: {
      type: DataTypes.STRING,
      defaultValue: 'Commercial Passenger Comprehensive',
    },

    // --- Pollution & Permit ---
    pollutionCertNumber: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    pollutionExpiryDate: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    permitType: {
      type: DataTypes.STRING,
      defaultValue: 'All India Tourist Permit',
    },
    permitExpiryDate: {
      type: DataTypes.STRING,
      defaultValue: '',
    },

    // --- Mileage & Odometer Maintenance ---
    currentOdometerKm: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    mileageKmpl: {
      type: DataTypes.FLOAT,
      defaultValue: 11.5,
    },
    fuelType: {
      type: DataTypes.ENUM('Diesel', 'Petrol', 'Electric', 'Hybrid', 'CNG'),
      defaultValue: 'Diesel',
    },
    lastServiceDate: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    nextServiceDueKm: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    // --- Driver / Mountain Pilot ---
    driverName: {
      type: DataTypes.STRING,
      defaultValue: 'Dedicated Mountain Pilot',
    },
    driverPhone: {
      type: DataTypes.STRING,
      defaultValue: '+91 98421 23456',
    },
    driverLicenseNumber: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    driverLicenseExpiry: {
      type: DataTypes.STRING,
      defaultValue: '',
    },

    // --- Status Flags ---
    status: {
      type: DataTypes.ENUM('available', 'on_tour', 'maintenance', 'inactive'),
      defaultValue: 'available',
    },
    isAvailableForRental: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isAvailableForTour: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isDelete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'Vehicle',
    tableName: 'vehicles',
    timestamps: true,
  }
);

export default Vehicle;
