import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const TripSettlement = sequelize.define(
  'TripSettlement',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    settlementCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    bookingId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Associated booking code (e.g. ESJ-2026-0001)',
    },
    tripTitle: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    destination: {
      type: DataTypes.STRING(100),
      defaultValue: 'Munnar',
    },
    tripDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    numPersons: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    numNights: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    numDays: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    tripRevenue: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Gross customer collection',
    },
    stayCost: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    stayPartnerName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    foodCost: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    foodPartnerName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    transportCost: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Jeep fuel, driver bata, tolls',
    },
    miscCost: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Campfire, permits, entry tickets',
    },
    totalExpenses: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Stay + Food + Transport + Misc',
    },
    netProfit: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Gross Revenue - Total Expenses',
    },
    profitMarginPercent: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    // Array of partner shares with status & payment details
    // [{ id, name, phone, sharePercent, amount, status: 'paid'|'pending', paidAt, paymentMode, paymentRef }]
    partnersBreakdown: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    overallStatus: {
      type: DataTypes.ENUM('settled', 'partial', 'pending'),
      defaultValue: 'pending',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: 'trip_settlements',
  }
);

export default TripSettlement;
