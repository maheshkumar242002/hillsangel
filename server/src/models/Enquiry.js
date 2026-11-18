import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Enquiry extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    return values;
  }
}

Enquiry.init(
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
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING,
      defaultValue: 'General Tour Enquiry',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('unread', 'read', 'replied'),
      defaultValue: 'unread',
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
    modelName: 'Enquiry',
    tableName: 'enquiries',
    timestamps: true,
  }
);

export default Enquiry;
