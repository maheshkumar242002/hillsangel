import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Destination extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    const jsonFields = ['subLocations', 'sightseeingSpots', 'popularFor'];
    jsonFields.forEach((field) => {
      if (typeof values[field] === 'string') {
        try {
          values[field] = JSON.parse(values[field]);
        } catch (e) {
          values[field] = [];
        }
      }
    });
    return values;
  }
}

Destination.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      trim: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Kerala',
    },
    tagline: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subLocations: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'List of places, areas or hubs within this hill destination (e.g. Kanthaloor, Munnar Town, Chinnakanal)',
    },
    sightseeingSpots: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'List of sightseeing attractions within this destination',
    },
    popularFor: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Activity tags e.g. 4x4 Off-Road, Tea Gardens, Campfire',
    },
    bestTimeToVisit: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'All Year Round',
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
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
    _id: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.id ? String(this.id) : undefined;
      },
    },
  },
  {
    sequelize,
    modelName: 'Destination',
    tableName: 'destinations',
    timestamps: true,
  }
);

export default Destination;
