import sequelize from '../config/db.js';
import TripSettlement from '../models/TripSettlement.js';

const sampleSettlements = [
  {
    settlementCode: 'SET-202610-101',
    tripTitle: 'Munnar Weekend Adventure (Family Group)',
    destination: 'Munnar',
    tripDate: '2026-10-04',
    numPersons: 10,
    numNights: 2,
    numDays: 3,
    tripRevenue: 65000,
    stayCost: 16000,
    stayPartnerName: 'Munnar Mist Valley Resort & Cottages',
    foodCost: 9000,
    foodPartnerName: 'Spice Garden Traditional Mess & Meals',
    transportCost: 7500,
    miscCost: 1500,
    totalExpenses: 34000,
    netProfit: 31000,
    profitMarginPercent: 48,
    overallStatus: 'settled',
    notes: 'Campfire + Jeep safari completed smoothly. Both partners settled via GPay.',
    partnersBreakdown: [
      {
        id: 'p1',
        name: 'Partner 1 (Mahesh)',
        phone: '9876543210',
        sharePercent: 50,
        amount: 15500,
        status: 'paid',
        paymentMode: 'gpay',
        paymentRef: 'UPI/261004112233',
        paidAt: '2026-10-05T10:30:00.000Z',
      },
      {
        id: 'p2',
        name: 'Partner 2 (Co-Organizer)',
        phone: '9845123456',
        sharePercent: 50,
        amount: 15500,
        status: 'paid',
        paymentMode: 'gpay',
        paymentRef: 'UPI/261004998877',
        paidAt: '2026-10-05T10:32:00.000Z',
      },
    ],
  },
  {
    settlementCode: 'SET-202610-102',
    tripTitle: 'Kodaikanal Pine Forest & Vattakanal Trek',
    destination: 'Kodaikanal',
    tripDate: '2026-10-11',
    numPersons: 14,
    numNights: 2,
    numDays: 3,
    tripRevenue: 84000,
    stayCost: 21000,
    stayPartnerName: 'Kodai Pine Peak Heritage Stay',
    foodCost: 14000,
    foodPartnerName: 'Cloud 9 Cafe & Grill Kodai',
    transportCost: 9500,
    miscCost: 2000,
    totalExpenses: 46500,
    netProfit: 37500,
    profitMarginPercent: 45,
    overallStatus: 'partial',
    notes: 'Corporate batch from Chennai. Mahesh paid; partner 2 pending balance settlement.',
    partnersBreakdown: [
      {
        id: 'p1',
        name: 'Partner 1 (Mahesh)',
        phone: '9876543210',
        sharePercent: 50,
        amount: 18750,
        status: 'paid',
        paymentMode: 'upi',
        paymentRef: 'UPI/261012554433',
        paidAt: '2026-10-12T14:15:00.000Z',
      },
      {
        id: 'p2',
        name: 'Partner 2 (Co-Organizer)',
        phone: '9845123456',
        sharePercent: 50,
        amount: 18750,
        status: 'pending',
        paymentMode: 'upi',
        paymentRef: '',
        paidAt: null,
      },
    ],
  },
  {
    settlementCode: 'SET-202610-103',
    tripTitle: 'Ooty Tea Trails & Avalanche Safari',
    destination: 'Ooty',
    tripDate: '2026-10-15',
    numPersons: 8,
    numNights: 1,
    numDays: 2,
    tripRevenue: 48000,
    stayCost: 12000,
    stayPartnerName: 'Nilgiri Clouds Resort & Cottages',
    foodCost: 6400,
    foodPartnerName: 'Nilgiri Biryani & Meals Point',
    transportCost: 6000,
    miscCost: 1200,
    totalExpenses: 25600,
    netProfit: 22400,
    profitMarginPercent: 47,
    overallStatus: 'pending',
    notes: 'Completed yesterday. Pending final bank reconciliation.',
    partnersBreakdown: [
      {
        id: 'p1',
        name: 'Partner 1 (Mahesh)',
        phone: '9876543210',
        sharePercent: 50,
        amount: 11200,
        status: 'pending',
        paymentMode: 'upi',
        paymentRef: '',
        paidAt: null,
      },
      {
        id: 'p2',
        name: 'Partner 2 (Co-Organizer)',
        phone: '9845123456',
        sharePercent: 50,
        amount: 11200,
        status: 'pending',
        paymentMode: 'upi',
        paymentRef: '',
        paidAt: null,
      },
    ],
  },
];

export const seedSettlements = async () => {
  try {
    await sequelize.authenticate();
    await TripSettlement.sync({ alter: true });

    const count = await TripSettlement.count();
    if (count === 0) {
      console.log('Seeding initial trip settlements and partner commissions...');
      await TripSettlement.bulkCreate(sampleSettlements);
      console.log(`Seeded ${sampleSettlements.length} trip settlements with commission logs successfully.`);
    } else {
      console.log(`TripSettlements already has ${count} records. Skipping seed.`);
    }
  } catch (error) {
    console.error('Error seeding settlements:', error);
  }
};

// Run directly if invoked as script
if (process.argv[1]?.endsWith('seedSettlements.js')) {
  seedSettlements().then(() => {
    console.log('Done.');
    process.exit(0);
  });
}
