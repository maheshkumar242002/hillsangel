import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Driver extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    if (typeof values.languages === 'string') {
      try {
        values.languages = JSON.parse(values.languages);
      } catch (e) {
        values.languages = ['Tamil', 'English'];
      }
    }
    return values;
  }
}

Driver.init(
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
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    altPhone: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    photoUrl: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    licenseExpiry: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    badgeNumber: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    experienceYears: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    specialization: {
      type: DataTypes.STRING,
      defaultValue: 'High-Altitude 4x4 Mountain Safari Pilot',
    },
    languages: {
      type: DataTypes.JSON,
      defaultValue: ['Tamil', 'English'],
    },
    emergencyContactName: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    bloodGroup: {
      type: DataTypes.STRING,
      defaultValue: 'O+',
    },
    address: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    assignedVehicleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    assignedVehicleReg: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    dailyBatta: {
      type: DataTypes.FLOAT,
      defaultValue: 800,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 4.9,
    },
    totalTripsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('available', 'on_tour', 'on_leave', 'inactive'),
      defaultValue: 'available',
    },
    notes: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
  },
  {
    sequelize,
    modelName: 'Driver',
    tableName: 'drivers',
    timestamps: true,
  }
);

export default Driver;
