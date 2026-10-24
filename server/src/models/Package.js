import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Package extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    const jsonFields = [
      'duration',
      'images',
      'itinerary',
      'inclusions',
      'exclusions',
      'highlights',
      'availableDates',
      'includedAssetIds',
      'availableVehicleIds',
    ];
    jsonFields.forEach((field) => {
      if (typeof values[field] === 'string') {
        try {
          values[field] = JSON.parse(values[field]);
        } catch (e) {}
      }
    });
    // Calculate seatsLeft
    values.seatsLeft = Math.max(0, (values.maxSeats || 6) - (values.seatsBooked || 0));
    return values;
  }
}

Package.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tier: {
      type: DataTypes.STRING,
      defaultValue: 'premium',
      allowNull: false,
    },
    tierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    destination: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.JSON,
      defaultValue: { days: 1, nights: 0 },
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    originalPrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    priceUnit: {
      type: DataTypes.STRING,
      defaultValue: 'per jeep',
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    itinerary: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    inclusions: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    exclusions: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    highlights: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    availableDates: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    maxSeats: {
      type: DataTypes.INTEGER,
      defaultValue: 6,
    },
    seatsBooked: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    includedAssetIds: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    availableVehicleIds: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    _id: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.id ? String(this.id) : undefined;
      },
    },
    seatsLeft: {
      type: DataTypes.VIRTUAL,
      get() {
        return Math.max(0, (this.maxSeats || 6) - (this.seatsBooked || 0));
      },
    },
  },
  {
    sequelize,
    modelName: 'Package',
    tableName: 'packages',
    timestamps: true,
  }
);

export default Package;
