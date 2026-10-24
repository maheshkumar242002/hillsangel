import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class PartnerTieup extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    const jsonFields = ['mealPricing', 'amenities', 'images'];
    jsonFields.forEach((field) => {
      if (typeof values[field] === 'string') {
        try {
          values[field] = JSON.parse(values[field]);
        } catch (e) {}
      }
    });
    return values;
  }
}

PartnerTieup.init(
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
    partnerCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(val) {
        this.setDataValue('partnerCode', (val || '').toUpperCase().trim());
      },
    },
    category: {
      type: DataTypes.ENUM('stay', 'food'),
      allowNull: false,
      defaultValue: 'stay',
      comment: 'stay for cottages/hotels, food for restaurants/messes',
    },
    type: {
      type: DataTypes.ENUM('cottage', 'hotel', 'resort', 'homestay', 'restaurant', 'cafe', 'mess', 'other'),
      allowNull: false,
      defaultValue: 'cottage',
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Munnar',
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactPerson: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pricingModel: {
      type: DataTypes.ENUM('per_person', 'per_trip', 'per_room', 'per_meal'),
      allowNull: false,
      defaultValue: 'per_person',
      comment: 'Settlement basis: per person, per trip, per room/night, or per meal',
    },
    pricePerPerson: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    pricePerTrip: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    pricePerRoom: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    mealPricing: {
      type: DataTypes.JSON,
      defaultValue: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        fullDay: 0,
      },
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      comment: 'Total rooms (for stay) or seating capacity (for food)',
    },
    maxGuestsPerRoom: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    foodType: {
      type: DataTypes.ENUM('all', 'veg', 'non_veg', 'buffet'),
      defaultValue: 'all',
    },
    amenities: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'List of features e.g. Campfire, Hot Water, Mountain View, Wi-Fi, Driver Room',
    },
    paymentTerms: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Settlement per trip completion',
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 4.8,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    _id: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.id ? String(this.id) : undefined;
      },
    },
  },
  {
    sequelize,
    modelName: 'PartnerTieup',
    tableName: 'partner_tieups',
    timestamps: true,
  }
);

export default PartnerTieup;
