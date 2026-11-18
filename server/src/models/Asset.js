import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Asset extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    if (typeof values.vehicleSpecs === 'string') {
      try {
        values.vehicleSpecs = JSON.parse(values.vehicleSpecs);
      } catch (e) {}
    }
    return values;
  }
}

Asset.init(
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
    assetCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(val) {
        this.setDataValue('assetCode', (val || '').toUpperCase().trim());
      },
    },
    category: {
      type: DataTypes.ENUM('vehicle', 'camping', 'trekking', 'electronics', 'amenity', 'other'),
      defaultValue: 'camping',
      allowNull: false,
    },
    buyPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    rentPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    rentUnit: {
      type: DataTypes.ENUM('per trip', 'per day', 'per person'),
      defaultValue: 'per trip',
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    availableQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('available', 'in_use', 'maintenance', 'retired'),
      defaultValue: 'available',
    },
    imageUrl: {
      type: DataTypes.TEXT,
    },
    description: {
      type: DataTypes.TEXT,
    },
    vehicleSpecs: {
      type: DataTypes.JSON,
      defaultValue: null,
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
    _id: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.id ? String(this.id) : undefined;
      },
    },
  },
  {
    sequelize,
    modelName: 'Asset',
    tableName: 'assets',
    timestamps: true,
  }
);

export default Asset;
