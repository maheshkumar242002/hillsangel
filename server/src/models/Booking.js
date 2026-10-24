import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Booking extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    const jsonFields = ['packageSnapshot', 'transportVehicle', 'rentalAssets', 'customFeatures', 'startInspection'];
    jsonFields.forEach((field) => {
      if (typeof values[field] === 'string') {
        try {
          values[field] = JSON.parse(values[field]);
        } catch (e) {}
      }
    });
    // Provide backwards compatibility aliases for Mongoose references
    if (values.customerId) values.customer = values.customerId;
    if (values.packageId) values.package = values.packageId;
    if (values.categoryId) values.categoryRef = values.categoryId;
    if (values.tierId) values.tierRef = values.tierId;
    return values;
  }
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bookingId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    bookingType: {
      type: DataTypes.STRING,
      defaultValue: 'tour_package',
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    packageSnapshot: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    travelDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    persons: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    pickupLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    transportVehicle: {
      type: DataTypes.JSON,
      defaultValue: null,
    },
    rentalAssets: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    customFeatures: {
      type: DataTypes.JSON,
      defaultValue: null,
    },
    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'cancelled', 'completed'),
      defaultValue: 'pending',
    },
    startInspection: {
      type: DataTypes.JSON,
      defaultValue: null,
      comment: 'Pre-trip vehicle condition, odometer, fuel level & photos at trip start',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    whatsappSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    modelName: 'Booking',
    tableName: 'bookings',
    timestamps: true,
  }
);

export default Booking;
