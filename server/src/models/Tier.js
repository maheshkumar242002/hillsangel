import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Tier extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    if (typeof values.perks === 'string') {
      try {
        values.perks = JSON.parse(values.perks);
      } catch (e) {}
    }
    return values;
  }
}

Tier.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.ENUM('premium', 'extra_premium'),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    badgeText: {
      type: DataTypes.STRING,
    },
    starRating: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
    resortType: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    badgeColor: {
      type: DataTypes.ENUM('elaichi', 'gold'),
      defaultValue: 'elaichi',
    },
    perks: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    modelName: 'Tier',
    tableName: 'tiers',
    timestamps: true,
  }
);

export default Tier;
