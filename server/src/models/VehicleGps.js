import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class VehicleGps extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    if (typeof values.routeHistory === 'string') {
      try {
        values.routeHistory = JSON.parse(values.routeHistory);
      } catch (e) {
        values.routeHistory = [];
      }
    }
    return values;
  }
}

VehicleGps.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vehicleName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    regNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    vehicleType: {
      type: DataTypes.STRING,
    },
    driverName: {
      type: DataTypes.STRING,
    },
    driverPhone: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM('on_tour', 'idle', 'returning', 'stopped', 'maintenance'),
      defaultValue: 'idle',
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    speed: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    heading: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    altitude: {
      type: DataTypes.FLOAT,
    },
    ignition: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    batteryLevel: {
      type: DataTypes.INTEGER,
    },
    currentLocationName: {
      type: DataTypes.STRING,
    },
    assignedTour: {
      type: DataTypes.STRING,
    },
    tripType: {
      type: DataTypes.STRING,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    destination: {
      type: DataTypes.STRING,
    },
    planCustomizations: {
      type: DataTypes.STRING,
    },
    passengersCount: {
      type: DataTypes.INTEGER,
    },
    routeHistory: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isDelete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
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
    modelName: 'VehicleGps',
    tableName: 'vehicle_gps',
    timestamps: true,
  }
);

export default VehicleGps;
