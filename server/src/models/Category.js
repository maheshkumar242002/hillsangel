import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Category extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    if (typeof values.highlights === 'string') {
      try {
        values.highlights = JSON.parse(values.highlights);
      } catch (e) {}
    }
    return values;
  }
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING,
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
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    targetAudience: {
      type: DataTypes.STRING,
    },
    icon: {
      type: DataTypes.STRING,
      defaultValue: 'Compass',
    },
    highlights: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    defaultMaxSeats: {
      type: DataTypes.INTEGER,
      defaultValue: 6,
    },
    defaultPriceUnit: {
      type: DataTypes.STRING,
      defaultValue: 'per jeep',
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
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
  }
);

export default Category;
