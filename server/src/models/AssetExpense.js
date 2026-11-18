import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class AssetExpense extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    return values;
  }
}

AssetExpense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    expenseCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        'fuel',
        'service_maintenance',
        'repair_parts',
        'insurance',
        'fc_permit',
        'tyres',
        'washing_cleaning',
        'toll_fastag',
        'gear_equipment',
        'other'
      ),
      allowNull: false,
      defaultValue: 'fuel',
    },
    entityType: {
      type: DataTypes.ENUM('vehicle', 'asset', 'general'),
      allowNull: false,
      defaultValue: 'vehicle',
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    vehicleReg: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    vehicleName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    assetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    assetCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    assetName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    expenseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    odometerKm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Partner who paid for this expense
    paidByPartnerId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'p1',
    },
    paidByPartnerName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      defaultValue: 'Managing Partner',
    },
    paymentMode: {
      type: DataTypes.ENUM('gpay_upi', 'cash', 'bank_transfer', 'credit_card', 'company_account'),
      defaultValue: 'gpay_upi',
    },
    paymentRef: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    receiptUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending_reimbursement', 'reimbursed', 'direct_company'),
      defaultValue: 'pending_reimbursement',
    },
    reimbursedAt: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    reimbursementRef: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    modelName: 'AssetExpense',
    tableName: 'asset_expenses',
    timestamps: true,
  }
);

export default AssetExpense;

