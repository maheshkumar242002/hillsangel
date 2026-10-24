import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Settings extends Model {
  toJSON() {
    const values = { ...this.get() };
    if (values.id !== undefined && values.id !== null) {
      values._id = String(values.id);
    }
    const jsonFields = ['socialLinks', 'hero', 'organizerPartners', 'tripExpenseDefaults'];
    jsonFields.forEach((field) => {
      if (typeof values[field] === 'string') {
        try {
          values[field] = JSON.parse(values[field]);
        } catch (e) {}
      }
    });
    return values;
  }
}

Settings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    siteName: {
      type: DataTypes.STRING,
      defaultValue: 'Hills Angel Tours and Travels',
    },
    tagline: {
      type: DataTypes.STRING,
      defaultValue: 'Curated Hill-Station Retreats & Group Trails',
    },
    whatsappNumber: {
      type: DataTypes.STRING,
      defaultValue: '918111039182',
    },
    contactPhone: {
      type: DataTypes.STRING,
      defaultValue: '+91 81110 39182',
    },
    contactEmail: {
      type: DataTypes.STRING,
      defaultValue: 'info@hillsangels.com',
    },
    address: {
      type: DataTypes.TEXT,
      defaultValue: 'Perur, Coimbatore South, Coimbatore, Tamil Nadu - 641026',
    },
    socialLinks: {
      type: DataTypes.JSON,
      defaultValue: {
        instagram: 'https://instagram.com/hillsangelstours',
        facebook: 'https://facebook.com/hillsangelstours',
        youtube: 'https://youtube.com/@hillsangelstours',
      },
    },
    hero: {
      type: DataTypes.JSON,
      defaultValue: {
        title: 'Discover the Mist-Clad Peaks of South India',
        subtitle: 'Handcrafted hill-station journeys for couples seeking intimacy and solo wanderers craving shared adventures.',
        badgeText: 'Certified Hill-Station Tour Specialists',
        bannerImage: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1920&q=80',
      },
    },
    organizerPartners: {
      type: DataTypes.JSON,
      defaultValue: {
        enabled: true,
        splitMode: 'percentage',
        partner1: {
          name: 'Partner 1 (Mahesh)',
          phone: '+91 81110 39182',
          sharePercent: 50,
          upiId: '',
        },
        partner2: {
          name: 'Partner 2 (Co-Organizer)',
          phone: '',
          sharePercent: 50,
          upiId: '',
        },
        notes: '50-50 profit split after all direct trip expenses (Stay + Food + Fuel/Transport)',
      },
    },
    tripExpenseDefaults: {
      type: DataTypes.JSON,
      defaultValue: {
        stayRatePerPersonNight: 600,
        foodRatePerPersonDay: 400,
        transportRatePerDay: 1800,
        driverBataPerTrip: 500,
        miscRatePerTrip: 300,
        autoSettleOnStatus: 'confirmed',
      },
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
    modelName: 'Settings',
    tableName: 'settings',
    timestamps: true,
  }
);

export default Settings;
